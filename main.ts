import { App, Notice, Plugin, PluginSettingTab, TFolder } from "obsidian"
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
	async onload() {
		await this.loadSettings();
		// console.log("Password Protect Plugin Launched!");

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

		// this.addRibbonIcon("settings", "Change Password", () => {
		// 	new ChangePasswordModal(this, (pass) => {
		// 		this.settings.password = pass;
		// 		this.saveSettings();
		// 		new Notice("Changed Password!");
		// 	}).open();
		// })

		//Ribbon Button
		this.addRibbonIcon("eye", "Show/Hide Files", () => {
			if (this.settings.hidden) {
				if (!this.settings.password) {
					new SetPasswordModal(this.app, (pass) => {
						this.settings.password = pass;
						this.saveSettings();
						for (const path of this.settings.hiddenList) {
							changePathVisibility(path, false);
							this.settings.hidden = false;
						}
					}).open();
					new Notice("Please Set A Password!");
				}
				else {
					new ProtectedPathsModal(this.app, (result) => {
						if (result == this.settings.password) {
							for (const path of this.settings.hiddenList) {
								changePathVisibility(path, false);
								this.settings.hidden = false;
							}
							new Notice("Password Correct!");
						} else {
							new Notice(`Wrong Password! Password:${this.settings.password}`);
						}
					}).open();
				}
		}
		else {
			this.settings.hidden = !this.settings.hidden;
			for (const path of this.settings.hiddenList) {
				changePathVisibility(path, this.settings.hidden);
			}
		}
		});

		//When application opened
		this.app.workspace.onLayoutReady(() => 
		{
			//Making sure the files are hidden when the app is launched
			this.settings.hidden = true;
			// Timeout is used to delay until the file explorer is loaded. Delay of 0 works, but I set it to 200 just to be safe.
			setTimeout(() => {
			for (const path of this.settings.hiddenList) {
				changePathVisibility(path, this.settings.hidden);
			}
			//If a hidden file is open close it.
			if (this.settings.hiddenList.includes(this.app.workspace.getActiveFile()?.name ?? ""))
				this.app.workspace.getLeaf().detach();
			}, 100);
			
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