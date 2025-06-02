





class VnNode {
    #childs;
    #data;

    constructor(name=null, parent=null, data=null, treedict=null, id=null) {
        this.parent = parent;
        this.#childs = [];

        if (treedict) {
            this.#data = treedict.data;
            if (treedict.childs.length) {
                this.add_child(new VnNode(null, null, null, child));
            }
        } else {
            this.#data = data || {};
        }
        if (!this.#data.hasOwnProperty("_vntree")) {
            this.#data._vntree = {};
        }
        if (name) this.name = name;
        this.id = id;

        if (parent !== null) parent.add_child(this);

    }

    get name() {
        return this.#data._vntree.name;
    }

    set name(name) {
        this.#data._vntree.name = name;
    }

    get id() {
        return this.#data._vntree.id;
    }

    set id(id=null) {
        this.#data._vntree.id = id || crypto.randomUUID();
    }

    get options() {
        return this.#data.options;
    }

    get url() {
        return this.#data.url;
    }

    get type() {
        return this.#data.type;
    }

    get selected() {
        return this.#data.selected;
    }

    get style() {
        return this.#data.style;
    }


    add_child (newChild) {
        this.#childs.push(newChild)
        newChild.parent = this
    }

    get_child(node=null) {
        if (node === null) {
            return this.#childs;
        } else if (Number.isInteger(node)) {
            if (node >= 0 && node < this.#childs.length) return this.#childs[node];
        } else if (typeof node === 'string') {  
            // else if (_.isString(node)) {
            // https://stackoverflow.com/questions/4059147/check-if-a-variable-is-a-string-in-javascript
            let named = this.get_child().filter(n => n.name === node);
            if (named.length === 1) return named[0];
            if (named.length > 1) return named;
        }
        return null;
    }


    get_root() {
        let n = this;
        while (n.parent) {
            n = n.parent
        }
        return n;
    }


    has_data(path){
        return this.#data.hasOwnProperty(path) ? true : false;
    }


    get_data(path=null) {
        if (path===null) return this.#data;
        if (this.has_data(path)) {
            return this.#data[path]
        }
        return null;
    }

    set_data(path, value) {
        // https://stackoverflow.com/questions/54733539/javascript-implementation-of-lodash-set-method
        // https://lodash.com/docs/4.17.15#set
        //let _obj = _.set(this.#data, path, value)
        // simple top-level set only (path the key)
        this.#data[path] = value;
        return true;        
    }


    *walk() {
        yield this;
        for (let child of this.get_child()) {
            yield* child;
        }
    }
    
    [Symbol.iterator]() {
        return this.walk();
    }


    get_node_by_id(id) {
        for (let _n of this) {
            if (_n.id === id) return _n;
        }
    }


    to_texttree(tabLevel=-1) {
        let nodetext = "";
        tabLevel += 1;
        for (let i =0; i < tabLevel; i++) {
            nodetext += ".   ";
        }
        nodetext += "|---" + this.name + "\n";   
        for (let child of this.get_child()) {
            nodetext += child.to_texttree(tabLevel);
        }
        return nodetext;
    }



    to_treedict() {
        let treeDict = {};
        treeDict.childs = [];
        treeDict.data = this.#data; 
        for (let child of this.#childs) {
            treeDict.childs.push(child.to_treedict());
        }
        return treeDict
    }


    to_JSON() {
        let treeDict = this.to_treedict();
        return JSON.stringify(treeDict);
    }


    static from_JSON(jsonStr) {
        let treeDict = JSON.parse(jsonStr);
        let rootnode = new VnNode(null, null, null, treeDict);
        return rootnode;
    }



}


// https://leafletjs.com/reference.html#control-layers
const layersTree = new VnNode("root");
const basemaps = new VnNode("basemaps", layersTree);
const overlays = new VnNode("overlays", layersTree);

export {VnNode, layersTree, basemaps, overlays};

