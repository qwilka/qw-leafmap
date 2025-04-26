

class VnNode {
    #childs;
    #data;

    constructor(name=null, parent=null, id=null, data={}, treedata={}) {
        this.parent = parent;
        this.#childs = [];

        if (treedict) {
            this.#data = treedict.data;
        } else {
            this.#data = data;
        }
        if (!this.#data.hasOwnProperty("_vntree")) {
            this.#data._vntree = {};
        }
        if (name) this.name = name;
        if (id) {
            this.#data._vntree.id = id;
        } else if (!this.#data._vntree.hasOwnProperty("id")) {
            this.#data._vntree.id = crypto.randomUUID();
        }

        if (treedict && treedict.childs.length) {
            this.#childs = [];
            for (let child of treedict.childs) {
                if (_.isNull(child)) {
                    this.#childs.push(null);
                } else {
                    this.add_child(new VnNode(null, null, null, null, child));
                }
            }
        } else if (parent !== null) {
            parent.add_child(this)
        }

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


    to_treedict() {
        let treeDict = {};
        treeDict.childs = [];
        treeDict.data = this.#data; 
        for (let child of this.#childs) {
            if (_.isNull(child)) {
                treeDict.childs.push(null);
            } else {
                treeDict.childs.push(child.to_treedict());
            }
            
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

    clone(change_id=true) {
        //let newtree = _.cloneDeep(this);
        let jstr = this.to_JSON();
        let newtree = VnNode.from_JSON(jstr);
        // if (change_id) {
        //     for (let n of newtree) {
        //         n.#data._vntree._id = crypto.randomUUID();
        //     }
        // }
        return newtree;
    }


}


if (typeof window === 'undefined') {
    module.exports = VnNode;
} else {
    window.VnNode = VnNode;
}
