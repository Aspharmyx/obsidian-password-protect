import { App, Modal, Setting } from "obsidian"

export class ProtectedPathsModal extends Modal {
    
    result: string;
    onSubmit: (result: string) => void;

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen(): void {
        const { contentEl } = this;

        contentEl.createEl("h1", {text: "Please Enter Password"})

        new Setting(contentEl)
        .setName("Password")
        .addText((text) => {
            text.inputEl.type = "password";
            text.onChange((value) => {this.result = value});
        });

        new Setting(contentEl)
        .addButton((btn) => 
        btn
            .setButtonText("Submit")
            .setCta()
            .onClick(() => {
                if (!this.result) return;
                this.close();
                this.onSubmit(this.result);
            })
        )
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty;
    }
}