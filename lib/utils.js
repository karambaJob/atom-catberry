'use babel'

export default class Utils {

	findDir(root, dirName) {
		const childs = root.getEntriesSync();
		for (let i = 0; i < childs.length; i++) {
			if (!childs[i].isDirectory()) continue;
			if(childs[i].getBaseName() === dirName) {
				return childs[i];
			}
			let res = this.findDir(childs[i], dirName);
			if (res) {
				return res;
			}
		}
		return false;
	}

	getList(dir, list) {
		if (typeof list === 'undefined') {

			var list = {
				names: [],
				paths: []
			};
		}
		const childs = dir.getEntriesSync();
		for (let i = 0; i < childs.length; i++) {
			if (childs[i].isFile()) {
				let name = childs[i].getBaseName();
				list.names.push(name);
				list.paths.push(`${dir.path}/${name}`);
			} else {
				this.getList(childs[i], list);
			}
		}
		return list;
	}
}
