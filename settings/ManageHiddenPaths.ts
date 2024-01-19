import { Notice, Setting } from 'obsidian';
import { HiddenPathsModal } from "modal/HiddenPathsModal";
import PasswordPlugin from "main";
import { ProtectedPathsModal } from "modal/ProtectedPathsModal";
import { SetPasswordModal } from 'modal/SetPasswordModal';


export class ManageHiddenPaths {

	public static create(plugin: PasswordPlugin, container: HTMLElement) {
		return new Setting(container)
		.setName(`Hidden Files and Folders`)
		.setDesc(`Add or remove files and folders from the list that are being hidden`)
		.addButton(b => {
			b.setButtonText(`Manage`)
			.onClick(event => {
				// sanity check to prevent other code from opening the modal
				if (!event.isTrusted) { return }

				if (!plugin.settings.password) {
					new Notice("Please Set A Password!");
					new SetPasswordModal(plugin.app, (pass) => {
						plugin.settings.password = pass;
						plugin.saveSettings();
					}).open();
				}
				else {
					new ProtectedPathsModal(plugin.app, (pass) => {
						if (pass == plugin.settings.password) {
							new HiddenPathsModal(plugin).open();
						}
						else {
							new Notice("Wrong Password!");
						}
					}).open();
				}
			})
		})
	}
}