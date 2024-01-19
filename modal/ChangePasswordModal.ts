import { Modal, Setting } from 'obsidian';
import PasswordPlugin from '../main';


export class ChangePasswordModal extends Modal {

    private plugin: PasswordPlugin;

    currentPassword: string;
    newPassword: string;
    confPassword: string;
    onSubmit: (newPassword: string) => void;

    constructor(plugin: PasswordPlugin, onSubmit: (newPassword: string) => void) {
        super(plugin.app);
        this.onSubmit = onSubmit;
        this.plugin = plugin;
    }
    
    onOpen(): void {
        const { contentEl } = this;

        contentEl.createEl("h1", {text: "Please Set A Password"})

        new Setting(contentEl)
        .setName("Current Password")
        .addText((text) => {
            text.inputEl.type = "password";
            text.onChange((value) => {this.currentPassword = value});
        });

        new Setting(contentEl)
        .setName("New Password")
        .addText((text) => {
            text.inputEl.type = "password";
            text.onChange((value) => {this.newPassword = value});
        });
        
        new Setting(contentEl)
        .setName("Confirm Password")
        .addText((text) => {
            text.inputEl.type = "password";
            text.onChange((value) => {this.confPassword = value});
        });

        new Setting(contentEl)
        .addButton((btn) => 
        btn
            .setButtonText("Submit")
            .setCta()
            .onClick(() => {
                if (!this.currentPassword) return;
                if (this.currentPassword == this.plugin.settings.password && this.newPassword == this.confPassword){
                    this.close();
                    this.onSubmit(this.newPassword);
                }
                else if (this.currentPassword != this.plugin.settings.password) {
                    const errorText = contentEl.createEl("h4", {text: "Current Password Is Wrong"});
                    setTimeout(() => {
                        errorText.remove();
                    }, 1500);
                }
                else if (this.newPassword != this.confPassword) {
                    const errorText = contentEl.createEl("h4", {text: "Passwords Doesn't Match"});
                    setTimeout(() => {
                        errorText.remove();
                    }, 1500);
                }
            })
        )
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty;
    }
}