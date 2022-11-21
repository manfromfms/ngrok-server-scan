module.exports = class Search {
    constructor() {
    }

    find(text, data) {
        var checkForText = (_text_, _data_) => {
            if(typeof _data_ == 'string') {
                return _data_.toLowerCase().includes(_text_)
            } else if(typeof _data_ == 'object') {
                var contains = false
                for(let i in _data_) {
                    if(checkForText(_text_, _data_[i])) contains = true
                }
                return contains
            } else {
                return false
            }
        }

        var output = []

        for(let i in data) {
            if(checkForText(text, data[i])) {
                output.push(data[i])
            }
        }

        return output
    }
}