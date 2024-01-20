import { App, Notice, Plugin, PluginSettingTab, TFile, TFolder, setIcon } from 'obsidian';
import { ProtectedPathsModal } from './modal/ProtectedPathsModal';
import { SetPasswordModal } from "./modal/SetPasswordModal";
// import { changePathVisibility } from "utils";
import { ManageHiddenPaths } from "settings/ManageHiddenPaths";
import { ChangePasswordSetting } from "settings/ChangePasswordSetting";
import { ShowHiddenFilesSetting } from "settings/ShowHiddenFilesSetting";
import { changePathVisibility } from 'utils';

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
	readonly EXT: string = "pp";
	ribbonButton: HTMLElement;

	async onload() {
		await this.loadSettings();
		// console.log("Password Protect Plugin Launched!");

		//Command for debugging
		this.addCommand({
			id: "all-hidden-files-to-md",
			name: "Turn all hidden files to Markdown",
			callback: () => {
				new ProtectedPathsModal(this.app, (result) => {
					if (result == this.settings.password) {
						//This method checks for every file in vault
						for (const file of this.app.vault.getFiles()) {
							if (file.extension == this.EXT) {
								const absFile = this.app.vault.getAbstractFileByPath(file.path);
								//Null Check
								if (absFile instanceof TFile) {
									const newPath = file.path.slice(0, file.path.length - this.EXT.length - 1) + ".md";
									this.app.vault.rename(absFile, newPath);
								}
							}
						}
						new Notice("Password correct!");
					} else {
						new Notice("Wrong password!");
					}
				}).open();
			}
		})

		//Right Click Menu
		this.registerEvent(
			this.app.workspace.on(`file-menu`, (menu, file) => {
				if (file instanceof TFolder) {
					menu.addItem((i) => {
						if (this.settings.hiddenList.includes(file.path)) {
							i.setTitle(`Unhide folder`)
							.setIcon(`eye`)
							.onClick(() => {
								this.changeIndVisAndSave(file.path, false);
							})
						} else {
							i.setTitle(`Hide folder`)
							.setIcon(`eye-off`)
							.onClick(() => {
								this.changeIndVisAndSave(file.path, true);
							})
						}
					})
				} else {
					menu.addItem((i) => {
						if (this.settings.hiddenList.includes(file.path)) {
							i.setTitle(`Unhide file`)
							.setIcon(`eye`)
							.onClick((e) => {
								this.changeIndVisAndSave(file.path, false);
							})
						} else {
							i.setTitle(`Hide file`)
							.setIcon(`eye-off`)
							.onClick((e) => {
								this.changeIndVisAndSave(file.path, true);
							})
						}
					})
				}
			})
		)

		//On active leaf change check if the file should be visible and close it if it shouldnt be
		//I don't know how it affects performance
		this.app.workspace.on("active-leaf-change", () => {
			if (this.settings.hidden) this.closeOpenFiles();
		})

		//Try to close open hidden files before app is closing
		this.app.workspace.on("quit", () => {
			this.closeOpenFiles();
		})

		//Ribbon Button
		this.ribbonButton = this.addRibbonIcon(this.settings.hidden ? "eye-off" : "eye", this.settings.hidden ? "Show hidden files" : "Hide files", () => {

			if (this.settings.hiddenList.length == 0) {
				new Notice("There are no hidden files.")
				return;
			}

			if (this.settings.hidden) {
				//If password not set show set password modal
				if (!this.settings.password) {
					new Notice("Please set a password!");
					new SetPasswordModal(this.app, (pass) => {
						this.settings.password = pass;
						this.saveSettings();
					}).open();
				}
				else {
					new ProtectedPathsModal(this.app, (result) => {
						if (result == this.settings.password) {
							this.changeFileVisibility(false);
							new Notice("Password correct!");
						} else {
							new Notice("Wrong password!");
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
		// for (const path of this.settings.hiddenList) {
		// 	changePathVisibility(path, hide);
		// }
		this.settings.hidden = hide;

		if (hide) {
			for (let i = 0; i < this.settings.hiddenList.length; i++) {
				const file = this.settings.hiddenList[i];
				if (file) {
					const absFile = this.app.vault.getAbstractFileByPath(file);
					if (absFile instanceof TFile) {
						if (absFile.extension == "md") {
							const newPath = file.slice(0,file.length - 3) + "." + this.EXT;
							this.app.vault.rename(absFile, newPath);
						}
					}
					else if (absFile instanceof TFolder) {
						changePathVisibility(file, hide);
						for (const childFile of absFile.children) {
							this.changeIndVis(childFile.path, hide);
						}
					}
				}
			}
		}
		else {
			for (const path of this.settings.hiddenList) {
				//Get the file with .pp extension
				const file = this.app.vault.getAbstractFileByPath(path);
				const ppPath = path.slice(0, path.length - 3) + "." + this.EXT;
				const ppFile = this.app.vault.getAbstractFileByPath(ppPath);
				//If its a file replace the extension with .md
				if (ppFile instanceof TFile) {
					const newPath = ppFile.path.slice(0, ppFile.path.length - this.EXT.length - 1) + ".md";
					this.app.vault.rename(ppFile, newPath);
				} 
				else if (file instanceof TFolder) {
					changePathVisibility(path, false);
					//For every note in the folder
					for (const childFile of file.children) {
						//Replace the extension with .md
						this.changeIndVis(childFile.path, hide);
					}
				}
			}
		}

		//If a hidden file is open close it. 
		this.closeOpenFiles();

		//Update ribbon button icon and text
		if (hide) {
			this.ribbonButton.ariaLabel = "Show hidden files";
			setIcon(this.ribbonButton, "eye-off");
		}
		else {
			this.ribbonButton.ariaLabel = "Hide files";
			setIcon(this.ribbonButton, "eye");
		}
	}
	closeOpenFiles (folderPath?: string) {
		const activeFile = this.app.workspace.getActiveFile();
		//Is there an open file?
		if (!activeFile) return;

		if (folderPath) {
			const folder = this.app.vault.getAbstractFileByPath(folderPath);
			if (folder instanceof TFolder) {
				for (const absFile of folder.children) {
					if (absFile instanceof TFile) {
						if(activeFile == absFile){
							this.app.workspace.getLeaf().detach();
						}
					}
					else if (absFile instanceof TFolder) {
						this.closeOpenFiles(absFile.path);
					}
				}
			}
			return;
		}

		//If there is an open file and its direktly in the hiddenList close it.
		if (this.settings.hiddenList.includes(activeFile.path)) {
			this.app.workspace.getLeaf().detach();
		}
		else {
			//Iterate every folder in hiddenList
			for (const path of this.settings.hiddenList) {
				const folder = this.app.vault.getAbstractFileByPath(path);
				if (folder instanceof TFolder) {
					//Iterate every file in those folders
					for (const absFile of folder.children) {
						//If the activeFile matches close it
						if (absFile instanceof TFile) {
							if(activeFile == absFile){
								this.app.workspace.getLeaf().detach();
							}
						}
						else if (absFile instanceof TFolder) {
							this.closeOpenFiles(absFile.path);
						}
					}
				}
			}
		}
	}
	changeIndVis (path: string, hide: boolean) {
		if (hide) {
			const absFile = this.app.vault.getAbstractFileByPath(path);
			if (absFile instanceof TFile) {
				if (absFile.extension == "md") {
					const newPath = path.slice(0, path.length - 3) + "." + this.EXT;
					this.app.vault.rename(absFile, newPath);
				}
			}
			else if (absFile instanceof TFolder) {
				changePathVisibility(path, hide);
				for (const childFile of absFile.children) {
					if (childFile instanceof TFile) {
						this.changeIndVis(childFile.path, hide);
					}
				}
			}
		}
		else {
			const absFile = this.app.vault.getAbstractFileByPath(path);
			//If its a file
			if (path.endsWith("." + this.EXT)) {
				//Find the file with .pp extension
				const ppPath = path.slice(0, path.length - 3) + "." + this.EXT;
				const file = this.app.vault.getAbstractFileByPath(ppPath);
				//Confirm its a file and its not null
				if (file instanceof TFile) {
					if (file.extension == this.EXT) {
						//Replace the .pp extension with .md
						const newPath = file.path.slice(0,file.path.length - this.EXT.length - 1) + ".md";
						this.app.vault.rename(file, newPath);
					}
				}
			} else if (absFile instanceof TFolder) {
				changePathVisibility(path, hide);
				for (const childFile of absFile.children) {
					this.changeIndVis(childFile.path, hide);
				}
			}
		}
	}
	changeIndVisAndSave (path: string, hide: boolean) {
		if (hide) {
			this.settings.hiddenList.push(path);
		}
		else {
			const i = this.settings.hiddenList.indexOf(path);
			this.settings.hiddenList.splice(i, 1);
		}
		this.saveSettings();

		if (this.settings.hidden) {
			const absFile = this.app.vault.getAbstractFileByPath(path);
			if (absFile instanceof TFile) {
				const newPath = path.slice(0, path.length - 3) + "." + this.EXT;
				this.app.vault.rename(absFile, newPath);
			}
			else if (absFile instanceof TFolder) {
				changePathVisibility(path, hide);
				for (const childFile of absFile.children) {
					if (childFile instanceof TFile) {
						this.changeIndVis(childFile.path, hide);
					}
				}
			}
		}
		else {
			const absFile = this.app.vault.getAbstractFileByPath(path);
			//If its a file
			if (path.endsWith(".md")){
				//Find the file with .pp extension
				const ppPath = path.slice(0, path.length - 3) + "." + this.EXT;
				const file = this.app.vault.getAbstractFileByPath(ppPath);
				//Confirm its a file and its not null
				if (file instanceof TFile) {
					if (file.extension == this.EXT) {
						//Replace the .pp extension with .md
						const newPath = file.path.slice(0, file.path.length - this.EXT.length - 1) + ".md";
						this.app.vault.rename(file, newPath);
					}
				}
			} else if (absFile instanceof TFolder) {
				changePathVisibility(path, hide);
				for (const childFile of absFile.children) {
					this.changeIndVis(childFile.path, hide);
				}
			}
		}
	}

	// unhidePath(path: string) {
	// 	const i = this.settings.hiddenList.indexOf(path);
	// 	this.settings.hiddenList.splice(i, 1);
	// 	changePathVisibility(path, false);
	// 	this.saveSettings();
	// }
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