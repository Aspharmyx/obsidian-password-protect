import PasswordPlugin from "main";
import { ChangePasswordModal } from "modal/ChangePasswordModal";
import { Notice, Setting } from "obsidian";


export class ChangePasswordSetting {

    public static create(plugin: PasswordPlugin, container: HTMLElement) {
        return new Setting(container)
        .setName("Change password")
		.setDesc(`Change the password by entering current password.`)
        .addButton(btn => {
            btn.setButtonText("Change password")
            .onClick(event => {
                if (!event.isTrusted) { return }

                new ChangePasswordModal(plugin, (pass) => {
                    plugin.settings.password = pass;
                    plugin.saveSettings();
                    new Notice("Changed password!");
                }).open();
            })
        })
    }
}