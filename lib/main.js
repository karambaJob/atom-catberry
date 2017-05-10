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
		this.selectList = new SelectListView();
		this.utils = new Utils();

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		// Register command that toggles this view
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'atom-catberry:show-files': () => this.getComponentDir(),
			'atom-catberry:show-component-uses': () => this.getComponentUses()
		}));

		const directorys = atom.project.getDirectories();
		const that = this;
		directorys.some((dir) => {
			that.componentsDir = dir.getSubdirectory('catberry_components');
			if (that.componentsDir.existsSync()) {
				return true;
			}
			that.componentsDir = false;
			return false;
		});
	},

	deactivate() {
		this.selectList.destroy();
		this.subscriptions.dispose();
		this.utils.destroy();
	},

	/**
	 * Remove if|else|unless blocks, replace handlebars variables to text string
	 * @param  {string} componentStr component string
	 * @returns {string}
	 */
	clearComponent(componentStr) {
		const replaceText = 'There must be a text or a number';

		return componentStr
			.replace(/{{#(if|unless) [\w.]+}}|{{\/(if|unless)}}/g, '')
			.replace(/{{else}}/g, '')
			.replace(/="{{(?!l10n)[ \.\w\"]+}}"/g, `="${replaceText}"`)
			.replace(/class="[\w\-]+"/g, '');
	},

	/**
	 * Return component with attributes
	 * @param  {string} str  search string
	 * @param  {string} name component name
	 * @returns {array|null}
	 */
	getComponents(str, name) {
		const attributes = '[ \\-\\wа-яА-ЯёЁ:="{}\\n\\t._#\\/]+><\\/';
		const componentReg = new RegExp(`<${name}${attributes}${name}>`, 'g');
		return str.match(componentReg);
	},

	/**
	 * Return params name-value object
	 * @param  {type} componentStr component string
	 * @returns {object}
	 */
	getParams(componentStr) {
		let params = componentStr.match(/[\wа-яА-ЯёЁ-]+="[\wа-яА-ЯёЁ{}\-. "\/]+"/g);
		if (!params) return null;
		const result = {};

		params.forEach(function(paramStr) {
			const paramPare = paramStr.split('=');
			const name = paramPare[0];
			const value = paramPare[1];
			result[name] = value.replace(/"{{(?!l10n)/g, '{');
		});
		return result;
	},

	/**
	 * Create a component row view
	 * @param  {object} params component params
	 * @param  {string} comp component code
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

		const templateFiles = this.utils.getAllTemplates(this.componentsDir);
		let resultTable = name + '\n<br/><table cellpadding="5" border="1" width="100%">';
		const that = this;

		templateFiles.forEach(function(file) {
			const components = that.getComponents(file.readSync(), name);
			if (components) {
				components.forEach(function(componentStr) {
					const componentParams = that.getParams(componentStr);
					const clearComp = that.clearComponent(componentStr);
					resultTable += that.createComponentRowView(componentParams, clearComp);
				});
			}
		});
		resultTable += '</table>';

		atom.workspace.open().then(function(textEd) {
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
		const dir = this.utils.getDir(this.componentsDir, name.replace('cat-', ''));
		if (dir) {
			this.selectList.show(dir);
		}
	},

	/**
	 * Return a cat component name from a cursor position
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
