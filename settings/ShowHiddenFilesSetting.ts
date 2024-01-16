import PasswordPlugin from "main";
import { ProtectedPathsModal } from "modal/ProtectedPathsModal";
import { SetPasswordModal } from "modal/SetPasswordModal";
import { Notice, Setting } from "obsidian";
import { changePathVisibility } from "utils";


export class ShowHiddenFilesSetting {

    public static create(plugin: PasswordPlugin, container: HTMLElement) {
        return new Setting(container)
        .setName("Show/Hide Files")
        .addButton(btn => {
            btn.setButtonText("Show/Hide Files")
            .onClick(event => {
                if (!event.isTrusted) { return }

                if (plugin.settings.hidden) {
                    if (!plugin.settings.password) {
                        new SetPasswordModal(plugin.app, (pass) => {
                            plugin.settings.password = pass;
                            plugin.saveSettings();
                        }).open();
                        new Notice("Please Set A Password!");
                    }
                    else {
                        new ProtectedPathsModal(plugin.app, (result) => {
                            if (result == plugin.settings.password) {
                                for (const path of plugin.settings.hiddenList) {
                                    changePathVisibility(path, false);
                                    plugin.settings.hidden = false;
                                }
                                new Notice("Password Correct!");
                            } else {
                                new Notice("Wrong Password!");
                            }
                        }).open();
                    }
            }
            else {
                plugin.settings.hidden = !plugin.settings.hidden;
                for (const path of plugin.settings.hiddenList) {
                    changePathVisibility(path, plugin.settings.hidden);
                }
            }
            })
        })
    }
}