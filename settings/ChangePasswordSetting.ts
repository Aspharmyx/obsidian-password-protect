import PasswordPlugin from "main";
import { ChangePasswordModal } from "modal/ChangePasswordModal";
import { Notice, Setting } from "obsidian";


export class ChangePasswordSetting {

    public static create(plugin: PasswordPlugin, container: HTMLElement) {
        return new Setting(container)
        .setName("Change Password")
        .addButton(btn => {
            btn.setButtonText("Change Password")
            .onClick(event => {
                if (!event.isTrusted) { return }

                new ChangePasswordModal(plugin, (pass) => {
                    plugin.settings.password = pass;
                    plugin.saveSettings();
                    new Notice("Changed Password!");
                }).open();
            })
        })
    }
}