module.exports = class ModSaver {
    constructor(path) {
        var fs = require('fs')
        this.path = path
        this.mods = JSON.parse(fs.readFileSync(this.path, 'utf8', (err) => {if(err) console.log(err)}))

        //this.codeString = '0123456789abcdefghijklmnopqrtuvwxyzABCDEFGHIJKLMOPQRSTUVWXYZ'
    }

    compareTwoArrays(arr1, arr2) {
        if(arr1.length != arr2.length) return false

        var same = true
        for(let i in arr1) {
            if(arr1[i] != arr2[i]) {
                same = false
            }
        }

        return same
    }

    newServerModinfo(modinfo) {
        var modList = modinfo.modList

        if(!this.mods.list) this.mods.list = {}
        if(!this.mods.combs) this.mods.combs = []

        var output = ''
        for(let i in modList) {
            if(this.mods.list[modList[i].modid]) {
                output += this.mods.list[modList[i].modid] + ' '
            } else {
                var len = Object.keys(this.mods.list).length
                this.mods.list[modList[i].modid] = {
                    id: len
                }
                output += this.mods.list[modList[i].modid] + ' '
            }
        }

        var fs = require('fs')
        fs.writeFileSync(this.path, JSON.stringify(this.mods), (err) => {if(err) console.log(err)})

        return output
    }
}

/*

for(let i in output[data.addition.name].modinfo.modList) {
    if(mods[output[data.addition.name].modinfo.modList[i].modid]) {
        out.push(mods[output[data.addition.name].modinfo.modList[i].modid].id)
    } else {
        var len = Object.keys(mods).length
        mods[output[data.addition.name].modinfo.modList[i].modid] = {
            id: len
        }
        out.push(mods[output[data.addition.name].modinfo.modList[i].modid].id)
    }
}

*/