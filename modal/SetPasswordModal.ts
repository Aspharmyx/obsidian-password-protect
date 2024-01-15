import { App, Modal, Setting } from "obsidian";


export class SetPasswordModal extends Modal {

    password: string;
    confPassword: string;
    onSubmit: (password: string) => void;

    constructor(app: App, onSubmit: (password: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }
    
    onOpen(): void {
        const { contentEl } = this;

        contentEl.createEl("h1", {text: "Please Set A Password"})

        new Setting(contentEl)
        .setName("Password")
        .addText((text) => text.onChange((value) => {this.password = value}));
        
        new Setting(contentEl)
        .setName("Confirm Password")
        .addText((text) => text.onChange((value) => {this.confPassword = value}));

        new Setting(contentEl)
        .addButton((btn) => 
        btn
            .setButtonText("Submit")
            .setCta()
            .onClick(() => {
                if (!this.password) return;
                if (this.password == this.confPassword){
                    this.close();
                    this.onSubmit(this.password);
                }
                else {
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