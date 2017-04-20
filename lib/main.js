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

	prepareStr(str) {
		return str
			.replace(/{{#(if|unless) [\w.]+}}|{{\/(if|unless)}}/g, '')
			.replace(/{{else}}/g, '')
			.replace(/="{{(?!l10n)[ \.\w\"]+}}"/g, '="здесь должен быть текст или цифра"')
			// .replace(/[\-\.\w\"]+="{{(?!l10n)[ \.\w\"]+}}"/g, '')
			.replace(/class="[\w\-]+"/g, '');
	},

	getComponents(str, name) {
		const componentReg = new RegExp('<' + name + '[ \\-\\wа-яА-ЯёЁ:="{}\\n\\t._#\\/]+><\\/' + name + '>', 'g');
		return str.match(componentReg);
	},

	getParams(componentStr) {
		let params = componentStr.match(/[\wа-яА-ЯёЁ-]+="[\wа-яА-ЯёЁ{}\-. "\/]+"/g);
		if (!params) return null;
		const result = {};
		for (let i = 0; i < params.length; i++) {
			let paramsPare = params[i].split('=');
			result[paramsPare[0]] = paramsPare[1].replace(/"{{(?!l10n)/g, '{');
		}
		return result;
	},

	/**
	 * Create a component row view
	 * @param  {object} params component params
	 * @param  {type} comp   component code
	 * @return {string} html string of component view
	 */
	createComponentRowView(params, comp) {
		let rowStr = '<tr>\n<td>';
		for (var x in params) {
			rowStr += `${x}=${params[x]}\n<br/>`;
		}
		rowStr += `</td><td>${comp}</td>\n</tr>`;
		return rowStr;
	},

	/**
	 * Creates a new tab with a list of a component uses
	 * @return {null}
	 */
	getComponentUses() {
		const name = this.getCatTagName();
		if (!name || !this.componentsDir.existsSync()) return;

		const testArr = [];
		const resArr = this.utils.getAllTemplates(this.componentsDir, testArr);
		let resultTable = name + '\n<br/><table cellpadding="5" border="1" width="100%">';
		for (let i = 0; i < resArr.length; i++) {
			let strResults = this.getComponents(resArr[i].readSync(), name);
			if (strResults) {
				for (let j = 0; j < strResults.length; j++) {
					let curParams = this.getParams(strResults[j]);
					let clearComp = this.prepareStr(strResults[j]);
					resultTable += this.createComponentRowView(curParams, clearComp);
				}
			}
		}
		resultTable += '</table>';

		atom.workspace.open().then(function(textEd) {
			textEd.insertText(name + '\n<br/>')
			textEd.insertText(resultTable);
		});
	},

	/**
	 * Show a list of files of component
	 * @return {null}
	 */
	getComponentDir() {
		const name = this.getCatTagName();
		if (!name || !this.componentsDir.existsSync()) return;
		const dir = this.utils.findDir(this.componentsDir, name.replace('cat-', ''));
		if (dir) {
			this.selectList.show(dir);
		}
	},

	/**
	 * Recturn a cat component name from a cursor position
	 * @return {strng|null}
	 */
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
