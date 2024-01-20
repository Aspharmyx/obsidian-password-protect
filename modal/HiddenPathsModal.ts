import { Modal, Setting } from "obsidian";
import PasswordPlugin from "../main";

export class HiddenPathsModal extends Modal {
	private plugin: PasswordPlugin;

	constructor(plugin: PasswordPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onOpen() {
		const {contentEl: content} = this;
		content.createEl(`h1`, { text: `Hidden files and folders` });
		content.createEl(`hr`);
		const body = content.createEl(`div`, { cls: `hidden-list-modal-body` });
		this.plugin.settings.hiddenList.forEach(path => {
			const c = body.createEl(`div`);
			new Setting(c)
			.setName(path)
			.addButton(btn => {
				btn.setIcon(`cross`)
				.setTooltip(`Remove`)
				.onClick((e) => {
					this.plugin.changeIndVisAndSave(path, false);
					c.hide();
				})
			})
		})
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}