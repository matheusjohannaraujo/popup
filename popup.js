
/*
	GitHub: https://github.com/matheusjohannaraujo/popup
	Country: Brasil
	State: Pernambuco
	Developer: Matheus Johann Araujo
	Date: 2020-12-10
*/

let global_array_popup = []
let global_array_popup_promise = []
const global_string_popup_css = `
<style>

#popup {
    display: inline-block;
    background: #fff;
    color: #000;
    margin: 10px;
    position: fixed;
    top: 50%;
    left: 50%;
    max-width: 500px;
    max-height: 500px;
    padding: 5px;
    border-radius: 4px;
    border: 1px solid #aaa;
    overflow: hidden;
    z-index: 9999;
    padding: 0 1rem 1rem;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
}

#popup #content {
    display: block;
    padding: 0;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
}

#popup #content #title {
    transition: 1s;
    display: block;
    margin-top: 1rem;
    font-style: italic;
    color: #666;
}

#popup #content #title:hover {
    transition: 0.25s;
    color: #000;
}

#popup #content #body {
    display: block;
    margin-top: 16px;
}

#popup #btns {
    display: block;
    margin-top: 1.7rem;
    text-align: right;
    padding: 0;
}

#popup #btns button {
    cursor: pointer;
    padding: 8px 22px;
    background: rgb(64, 138, 236);
    border: 1px solid rgb(50, 111, 255);
    border-radius: 3px;
    font-weight: bold;
    color: #fff;
    transition: 0.75s;
}

#popup #btns button:hover {
    background: rgb(50, 111, 255);
    border: 1px solid rgb(30, 91, 255);
    transition: 0.5s;
}

#popup #btns button:nth-child(2) {
    background: #fff;
    color: rgb(64, 138, 236);
    margin-left: 3.9px;
}

#popup #btns button:nth-child(2):hover {
    background: rgb(245, 245, 245);
}

</style>
`

class POPUP extends HTMLElement {

    popup_template() {
        return `
            ${global_string_popup_css}
            <div id="popup">
                <div id="content">
                    <label>
                        <slot id="title" name="title">${(window.location.host != "" ? window.location.host : (document.title != "" ? document.title : "localhost"))} diz</slot>
                    </label>
                    <slot id="body" name="body" />
                </div>
                <div id="btns">
                    <button id="btn_ok" title="Yes | Sim">OK</button>
                    <button id="btn_cancel" title="No | Não">Cancelar</button>
                </div>
            </div>
        `
    }

    static get observedAttributes() {
        return ["data-config"];
    }

    clear_shadow_root(elt) {
        if (elt !== null && typeof(elt) == "object") {
            while (elt.firstChild) {
                elt.removeChild(elt.firstChild);
            }
        }
    }

    render(template) {
        if (typeof(template) == "string") {
            let content = template
            template = document.createElement("template")
            template.innerHTML = content
        }
        if (template === null || typeof(template) != "object") {
            return
        }
        template = template.content.cloneNode(true)
        if (this.shadowRoot === null) {
            this.attachShadow({ mode: "open" })
        } else {
            this.clear_shadow_root(this.shadowRoot)
        }
        this.shadowRoot.appendChild(template)
    }

    constructor() {
        super()
        this.render(this.popup_template())
        this.$popup = this.shadowRoot.querySelector("#popup")
        this.$title = this.$popup.querySelector("#title")
        this.$body = this.$popup.querySelector("#body")
        this.$input = []
        this.$btn_ok = this.$popup.querySelector("#btn_ok")
        this.$btn_cancel = this.$popup.querySelector("#btn_cancel")
        this._count = global_array_popup.length
        this._callback = () => {}
        this._timer = false
        if (global_array_popup.length > 0) {
            this.$popup.style.display = "none";
            this._suspended = true
            global_array_popup.push(this)
        } else {
            global_array_popup.push(this)
        }
    }       

    popup_center_top() {
        this.$popup.style.marginTop = `-${parseInt(this.$popup.offsetHeight/2)}px`
        return parseInt(this.$popup.offsetHeight/2)
    }

    popup_center_left() {
        this.$popup.style.marginLeft = `-${parseInt(this.$popup.offsetWidth/2)}px`
        return parseInt(this.$popup.offsetWidth/2)
    }

    popup_btn_ok() {
        this.popup_callback({
            result: true,
            context: this
        })
    }

    popup_btn_cancel() {
        this.popup_callback({
            result: false,
            context: this
        })
    }

    popup_next() {
        if (global_array_popup.length > 0) {
            global_array_popup.shift(0, 1)
        }
        if (global_array_popup.length > 0) {
            let popup_item = global_array_popup[0]
            popup_item._suspended = false
            popup_item.$popup.style.display = "";
            popup_item.connectedCallback()
        }
    }

    popup_callback(response) {
        if (this._timer) {
            window.clearTimeout(this._timer)
        }
        if (typeof(this._callback) == "function") {
            response.callback = this._callback(response) || null
            const len = global_array_popup_promise.length
            if (len > 0) {
                const id = this.getAttribute("id")
                for (let i = 0; i < len; i++) {
                    if (global_array_popup_promise[i].id == id) {
                        global_array_popup_promise[i].resolve(response)
                        global_array_popup_promise.splice(i, 1)
                        break;
                    }
                }
            }
        }
        this.$popup.style.display = "none"
        this.$popup.remove()
        this.popup_next()
    }

    connectedCallback() {

        if (this._suspended) {
            return false
        }

        this.$btn_ok.addEventListener("click", this.popup_btn_ok.bind(this))
        this.$btn_cancel.addEventListener("click", this.popup_btn_cancel.bind(this))        
        let data_config = this.getAttribute("data-config") || null

        if (typeof(data_config) == "string" && data_config.length >= 2) {
            try {
                data_config = data_config.replace(/'/gi, '"')
                data_config = JSON.parse(data_config)
            } catch (e) {
                data_config = null
            }
        }

        if (typeof(data_config?.style) != "undefined") {
            const style = data_config.style            
            if (typeof(style) == "object") {
                for (var key in style){
                    this.$popup.style[key] = style[key]
                }
            }
        }

        if (typeof(data_config?.top) != "undefined") {
            const top = data_config.top
            if (typeof(top) == "string") {
                this.$popup.style.top = top
            } else if (typeof(top) == "number") {
                this.$popup.style.top = `${top}%`
            }
        } else {
            let _old = 0
            let _interval = window.setInterval(() => {
                let _new = this.popup_center_top()
                if (_new == _old) {
                    window.clearInterval(_interval)
                } else {
                    _old = _new
                }
            }, 125)
            window.addEventListener("resize", this.popup_center_top.bind(this))
        }

        if (typeof(data_config?.left) != "undefined") {
            const left = data_config.left
            if (typeof(left) == "string") {
                this.$popup.style.left = left
            } else if (typeof(left) == "number") {
                this.$popup.style.left = `${left}%`
            }
        } else {            
            let _old = 0
            let _interval = window.setInterval(() => {
                let _new = this.popup_center_left()
                if (_new == _old) {
                    window.clearInterval(_interval)
                } else {
                    _old = _new
                }
            }, 75)
            window.addEventListener("resize", this.popup_center_left.bind(this))
        }

        const input_config = inp => {
            if (inp.style.display == "") {
                inp.style.display = "block"
            }
            if (inp.style.border == "") {
                inp.style.border = "1px solid #999"
            }
            if (inp.style.borderRadius == "") {
                inp.style.borderRadius = "3px"
            }
            if (inp.style.padding == "") {
                inp.style.padding = "10px"
            }
            if (inp.style.marginTop == "") {
                inp.style.marginTop = "0.5rem"
            }
        }

        if (typeof(data_config?.seconds) != "undefined") {
            const seconds = parseFloat(data_config.seconds) * 1000
            if (typeof(seconds) == "number") {
                this._timer = window.setTimeout(() => this.popup_btn_cancel(), seconds)
            }
        }

        if (typeof(data_config?.callback) != "undefined") {
            let callback = data_config.callback
            if (typeof(callback) == "string") {
                callback = new Function('return ' + callback)()
            }
            this._callback = callback
        }

        if (typeof(data_config?.type) == "undefined" || data_config?.type == "alert") {
            this.$btn_cancel.style.display = "none"
        } else if (typeof(data_config?.type) != "undefined" && data_config?.type == "prompt") {
            let selectorInput = null
            if (this.querySelector("[slot='body']") === null) {
                const input = document.createElement("input")
                input.setAttribute("type", "text")
                input_config(input)
                this.$body.appendChild(input)
                selectorInput = this.$body.querySelectorAll("input")
                selectorInput[selectorInput.length - 1].focus()
            } else {
                selectorInput = this.querySelectorAll("input")
                selectorInput.forEach((inp) => {
                    input_config(inp)
                    if (inp.getAttribute("type") != "button") {
                        inp.focus()
                    }
                })
            }
            this.$input = selectorInput
        }

        return true
    }

}

window.customElements.define("popup-js", POPUP)

function popup()
{    
    let obj = {}

    obj._content = null
    obj._config = {}

    obj.title = val => {
        if (obj._content === null) {
            obj._content = ""
        }
        obj._content += `<label slot="title">${val}</label>`
        return obj
    }

    obj.body = val => {
        if (obj._content === null) {
            obj._content = ""
        }
        obj._content += `<div slot="body">${val}</div>`
        return obj
    }

    obj.content = val => {
        if (obj._content === null) {
            obj._content = ""
        }
        obj._content += val
        return obj
    }

    obj.config = val => {
        obj._config = Object.assign(obj._config, val)
        return obj
    }

    obj.type = val => {
        obj._config.type = val
        return obj
    }

    obj.alert = () => {
        obj._config.type = "alert"
        return obj
    }

    obj.prompt = () => {
        obj._config.type = "prompt"
        return obj
    }

    obj.confirm = () => {
        obj._config.type = "confirm"
        return obj
    }

    obj.seconds = val => {
        obj._config.seconds = parseFloat(val)
        return obj
    }

    obj.top = val => {
        obj._config.top = val
        return obj
    }

    obj.left = val => {
        obj._config.left = val
        return obj
    }

    obj.style = val => {
        obj._config.style = val
        return obj
    }

    obj.callback = val => {
        obj._config.callback = val.toString()
        return obj
    }

    obj.show = () => {
        return new Promise((resolve, reject) => {
            const popup_js = document.createElement("popup-js")
            const id = `id${parseInt(Math.random() * 9999999999999999)}`
            popup_js.setAttribute("id", id)
            popup_js.setAttribute("data-config", JSON.stringify(obj._config))
            if (typeof(obj._content) == "string") {
                popup_js.innerHTML = obj._content
            }
            document.body.appendChild(popup_js)
            global_array_popup_promise.push({
                id,
                resolve,
                reject
            })
        })
    }

    return obj
}
