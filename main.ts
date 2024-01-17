import { App, Notice, Plugin, PluginSettingTab, TFolder, setIcon } from 'obsidian';
import { ProtectedPathsModal } from './modal/ProtectedPathsModal';
import { SetPasswordModal } from "./modal/SetPasswordModal";
import { changePathVisibility } from "utils";
import { ManageHiddenPaths } from "settings/ManageHiddenPaths";
import { ChangePasswordSetting } from "settings/ChangePasswordSetting";
import { ShowHiddenFilesSetting } from "settings/ShowHiddenFilesSetting";

interface PasswordPluginSettings {
	hidden: boolean;
	hiddenList: string[];
	password: string;
}

export default class PasswordPlugin extends Plugin {
	settings: PasswordPluginSettings = {
		hidden: true,
		hiddenList: [],
		password: "",
	}
	ribbonButton: HTMLElement;

	async onload() {
		await this.loadSettings();
		console.log("Password Protect Plugin Launched!");

		//Right Click Menu
		this.registerEvent(
			this.app.workspace.on(`file-menu`, (menu, file) => {
				if (file instanceof TFolder) {
					menu.addItem((i) => {
						if (this.settings.hiddenList.includes(file.path)) {
							i.setTitle(`Unhide Folder`)
							.setIcon(`eye`)
							.onClick(() => {
								this.unhidePath(file.path);
							})
						} else {
							i.setTitle(`Hide Folder`)
							.setIcon(`eye-off`)
							.onClick(() => {
								changePathVisibility(file.path, this.settings.hidden);
								this.settings.hiddenList.push(file.path);
								this.saveSettings();
							})
						}
					})
				} else {
					menu.addItem((i) => {
						if (this.settings.hiddenList.includes(file.path)) {
							i.setTitle(`Unhide File`)
							.setIcon(`eye`)
							.onClick((e) => {
								this.unhidePath(file.path);
							})
						} else {
							i.setTitle(`Hide File`)
							.setIcon(`eye-off`)
							.onClick((e) => {
								changePathVisibility(file.path, this.settings.hidden);
								this.settings.hiddenList.push(file.path);
								this.saveSettings();
							})
						}
					})
				}
			})
		)

		//Ribbon Button
		this.ribbonButton = this.addRibbonIcon(this.settings.hidden ? "eye-off" : "eye", this.settings.hidden ? "Show Hidden Files" : "Hide Files", () => {

			if (this.settings.hiddenList.length == 0) {
				new Notice("There Are No Hidden Files.")
				return;
			}

			if (this.settings.hidden) {
				//If password not set show set password modal
				if (!this.settings.password) {
					new Notice("Please Set A Password!");
					new SetPasswordModal(this.app, (pass) => {
						this.settings.password = pass;
						this.saveSettings();
					}).open();
				}
				else {
					new ProtectedPathsModal(this.app, (result) => {
						if (result == this.settings.password) {
							this.changeFileVisibility(false);
							new Notice("Password Correct!");
						} else {
							new Notice("Wrong Password!");
						}
					}).open();
				}
			}
			else {
				this.changeFileVisibility(true);
			}
		});

		//When application opened
		this.app.workspace.onLayoutReady(() => 
		{
			//Sets an event for when the file explorer changes/renders and makes files hidden then destroys the event
			setTimeout(() => {
				const leaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
				const observer = new MutationObserver(() => {
					this.changeFileVisibility(true);
					observer.disconnect();
				});
				observer.observe(leaf.view.containerEl, {attributes: true, subtree: true, characterData: true})

				this.changeFileVisibility(true);
			}, 2)
		})


		//Settings
		this.addSettingTab(new PasswordPluginSettingsTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, this.settings, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
	changeFileVisibility(hide: boolean) {
		for (const path of this.settings.hiddenList) {
			changePathVisibility(path, hide);
		}
		this.settings.hidden = hide;

		//If a hidden file is open close it.
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			if (this.settings.hiddenList.includes(activeFile.path))
			for (const path of this.settings.hiddenList) {
				const folder = this.app.vault.getAbstractFileByPath(path);
				if (folder instanceof TFolder) {
					for (const file of folder.children) {
						if(this.settings.hiddenList.includes(file.path)){
							this.app.workspace.getLeaf().detach();
						}
					}
				}
			
			}
			// this.app.workspace.getLeaf().detach();
		}

		//Update ribbon button icon and text
		if (hide) {
			this.ribbonButton.ariaLabel = "Show Hidden Files";
			setIcon(this.ribbonButton, "eye-off");
		}
		else {
			this.ribbonButton.ariaLabel = "Hide Files";
			setIcon(this.ribbonButton, "eye");
		}
	}
	unhidePath(path: string) {
		const i = this.settings.hiddenList.indexOf(path);
		this.settings.hiddenList.splice(i, 1);
		changePathVisibility(path, false);
		this.saveSettings();
	}
}

//Settings
class PasswordPluginSettingsTab extends PluginSettingTab {
	plugin: PasswordPlugin;

	constructor(app: App, plugin: PasswordPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl: container } = this;

		container.empty();
		ShowHiddenFilesSetting.create(this.plugin, container);
		ChangePasswordSetting.create(this.plugin, container);
		ManageHiddenPaths.create(this.plugin, container);
	}
}