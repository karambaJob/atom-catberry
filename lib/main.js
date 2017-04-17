'use babel';

import SelectListView from './select-list-view';
import Utils from './utils';
import { CompositeDisposable } from 'atom';

export default {

	selectList: null,
	utils: null,
	subscriptions: null,
	componentsDir: null,

	activate(state) {
		console.log('activate');
		this.selectList = new SelectListView(state.myPackageViewState);
		this.utils = new Utils();

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		// Register command that toggles this view
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'atom-catberry:show-files': () => this.getComponentDir(),
			'atom-catberry:show-component-uses': () => this.getComponentUses()
		}));


		const project = atom.project;
		this.componentsDir = project.getDirectories()[0].getSubdirectory('catberry_components');
	},

	deactivate() {
		this.selectList.destroy();
		this.subscriptions.dispose();
		this.utils.destroy();
	},

	serialize() {
		return {
			myPackageViewState: this.myPackageView.serialize()
		};
	},

	getComponentUses() {
		const name = this.getCatTagName();
		if (!name || !this.componentsDir.existsSync()) return;

		const testArr = [];
		const resArr = this.utils.getAllTemplates(this.componentsDir, testArr);
		let allLabels = [];
		const componentReg = new RegExp('<' + name + '[ \\-\\w="{}\\n\\t._#\\/]+><\\/' + name + '>', 'g');
		for (i = 0; i < resArr.length; i++) {
			let str = resArr[i].readSync();
			let strResults = str.match(componentReg);
			if (strResults) {
				allLabels = allLabels.concat(strResults);
			}
		}
		atom.workspace.open().then(function(textEd) {
			textEd.insertText(allLabels.join('\n'));
		});
	},

	getComponentDir() {
		const name = this.getCatTagName();
		if (!name || !this.componentsDir.existsSync()) return;
		const dir = this.utils.findDir(this.componentsDir, name.replace('cat-', ''));
		if (dir) {
			this.selectList.show(dir);
		}
	},

	getCatTagName() {
		const editor = atom.workspace.getActiveTextEditor();
		const cursor = editor.getCursors()[0];
		const optionsStart = {
			wordRegex: /<[a-z-]*/g
		}
		const range = cursor.getCurrentWordBufferRange(optionsStart);
		const startText = editor.getTextInBufferRange(range);

		const endPoint = cursor.getEndOfCurrentWordBufferPosition({
			wordRegex: /[a-z-]+/g
		});
		range.end = endPoint;
		const endText = editor.getTextInBufferRange(range);
		if (endText === '' || /^<cat-/g.test(endText) === false) return false;
		return endText.replace('<', '').split(/\s/g)[0];
	}
};
