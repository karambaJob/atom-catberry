'use babel'

export default class Utils {

	/**
	 * Return all handlebars templates files
	 * @param  {type} root search directory
	 * @param  {type} [filesArr] finded template files
	 * @returns {array} array of files
	 */
	getAllTemplates(root, filesArr) {
		filesArr = filesArr || [];
		const templateReg = new RegExp('template.hbs');
		const childs = root.getEntriesSync();
		const utils = this;
		childs.forEach(function(child) {
			if (child.isFile() && templateReg.test(child.getBaseName())) {
				filesArr.push(child);
			} else if (child.isDirectory()) {
				filesArr = utils.getAllTemplates(child, filesArr);
			}
		});

		return filesArr;
	}


	/**
	 * Return directory by name
	 * @param  {type} root    search directory
	 * @param  {type} dirName directory name
	 * @returns {directory|null}
	 */
	getDir(root, dirName) {
		const childs = root.getEntriesSync();

		for (let i = 0; i < childs.length; i++) {
			let child = childs[i];
			if (!child.isDirectory()) continue;
			if(child.getBaseName() === dirName) {
				return child;
			}
			let res = this.getDir(child, dirName);
			if (res) {
				return res;
			}
		}
		return null;
	}

	/**
	 * Return list of names and paths for directory files
	 * @param  {string} dirName directory name
	 * @param  {object} [list] current list
	 * @returns {object}
	 */
	getList(dirName, list) {
		if (typeof list === 'undefined') {

			var list = {
				names: [],
				paths: []
			};
		}
		const childs = dirName.getEntriesSync();
		for (let i = 0; i < childs.length; i++) {
			if (childs[i].isFile()) {
				let name = childs[i].getBaseName();
				list.names.push(name);
				list.paths.push(`${dirName.path}/${name}`);
			} else {
				this.getList(childs[i], list);
			}
		}
		return list;
	}
}
