'use babel';

SpacePen = require('atom-space-pen-views');
import Utils from './utils';

export default class SelectListView extends SpacePen.SelectListView {
	initialize() {
		super.initialize();
		this.dir = null;
		this.panel = null;
	}

	createPanel() {
		this.panel = atom.workspace.addModalPanel({item: this});
	}

	show(dir) {
		this.dir = dir;
		if (!this.panel) {
			this.createPanel();
		}
		const utils = new Utils();
		this._list = utils.getList(dir);
		this.setItems(this._list.names);

		this.panel.show();
		this.focusFilterEditor();
	}

	hide() {
		this.dir = null;
		this._list = null;
		this.panel.hide();
	}

	viewForItem(item) {
		return `<li>${item}</li>`;
	}

	confirmed(item) {
		const openParams = {
			newWindow: false
		};

		openParams.pathsToOpen = this._list.paths[this.getSelectedItemView().index()];
		atom.open(openParams);
		this.hide();
	}

	cancelled() {
		this.hide();
	}
}
