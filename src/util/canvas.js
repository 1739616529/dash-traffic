
export class RenderPath {

    /**
     * 渲染标识
     */
    target


    /**
     * canvas 元素
     */
    $el

    /**
     * 鼠标是否已经按下
     */
    mouseDown = false

    /**
     * 配置
     */
    config = {
        color: "green",
        size: 12,
    }

    /**
     * 2d 上下文
     */
    ctx_2d

    /**
     * 当前激活的 event
     */
    event

    /**
     * 广播
     */
    _emit = {}

    /**
     * 历史
     */
    history = []

    /**
     * 当前激活的历史下标
     */
    history_index = 0

    /**
     * 当前激活的路径 path [x, y][]
     */
    path = []

    /**
     * 是否在移动状态 当鼠标左击抬起重置为false
     */
    is_move = false

    constructor(target) {
        this.target = target
        this.init()
    }

    init() {
        let $el = null
        if (typeof this.target === "string") {
            $el = document.getElementById(this.target)
        }else if (this.target instanceof HTMLElement) {
            $el = this.target
        }
        const { clientWidth, clientHeight } = $el
        const canvas = document.createElement("canvas")
        canvas.width = clientWidth,
        canvas.height = clientHeight
        canvas.style = "width: 100%; height: 100%"
        this.$el = canvas
        this.target = $el
        $el.appendChild(canvas)
        this.ctx_2d = this.$el.getContext("2d");
        this.canvasEvent()
    }

    setConfig(config) {
        this.config = {
            ... this.config,
            ... config,
        }
    }

    handleMousedown = (event) => {
        this.mouseDown = true
        this.ctx_2d.beginPath()
        this.path = []
    }
    handleMouseup = (event) => {
        this.mouseDown = false
        this.is_move = false
        this.send("save")
        this.saveStore()
        this.setHistory()
    }
    handleMousemove = (event) => {
        if (!this.mouseDown) return
        this.event = event
        this.renderLine([ event.offsetX, event.offsetY ])
    }


    renderLine(path) {
        if (!this.ctx_2d) return 
        const ctx = this.ctx_2d
        const { color, size } = this.config
        ctx.lineWidth = size
        ctx.lineTo(path[0], path[1])
        ctx.strokeStyle = color
        ctx.lineCap = "round";
        ctx.stroke()
        this.setMovePath(path)
    }

    canvasEvent() {
        if (!this.$el) return;
        const $el = this.$el;
        $el.addEventListener("mousedown", this.handleMousedown, false)
        $el.addEventListener("mouseup", this.handleMouseup, false)
        $el.addEventListener("mousemove", this.handleMousemove, false)
        
    }

    backoutStore() {
        if (!this.ctx_2d) return

        this.history_index--
        if (this.history_index < 0) return this.history_index = 0
        this.renderByHistory()
    }

    saveStore() {
        if (!this.ctx_2d) return
    }

    setMovePath(path) {
        this.path.push(path)
    }

    setHistory() {
        this.history[this.history_index] = {
            config: { ... this.config },
            path: this.path
        }
        this.history_index++
    }



    renderByHistory() {
        this.clearCanvas()
        const index = this.history_index
        for(let i = 0; i < index; i++) {
            const history = this.history[i]
            this.setConfig(history.config)
            this.ctx_2d.beginPath()
            history.path.forEach(v => this.renderLine(v))
            this.ctx_2d.closePath()
        }
    }

    clearRect({ size }, [x, y]) {
        this.ctx_2d.clearRect(x, y, size, size)
    }

    cleanByHistory() {
        const index = this.history_index
        const {config, path} = this.history[index]
        path.forEach(v => this.clearRect(config, v))
    }


    clearCanvas() {
        this.$el.width = this.$el.width
        this.$el.height = this.$el.height
        this.send("clearCanvas")
    }




    send(event, ...args) {
        const fn_list = this._emit[event]
        if (fn_list) return fn_list.map(v => v(...args))
    }

    on(event, fn) {
        if (!(event in this._emit)) this._emit[event] = []
        this._emit[event].push(fn)
    }
}

export class RenderPathAni extends RenderPath {
    

    /**
     * 动画配置
     */
    ani_config= {
        icon: [],
        size: [20, 20],
        preloadIcon: false,
        time: 2000,
    }

    /**
     * 
     * icon dom 列表
     */
    icon_list = []


    constructor(target) {
        super(target)
        this.antInit()
    }


    antInit() {
        this.target.style.position = "relative"
    }


    renderIconToPath() {
        const { size, time } = this.ani_config

        this.send("aniPreStart")

        this.icon_list.forEach(v => v.style.display = "none")

        const render_count = time / 1000 * 60
        let render_num = 0

        const ani_context = this.history.map((v, i) => {
            return {
                index: 0,
                path: v.path,
                speed: v.path.length / render_count,
                icon: this.icon_list[i]
            }
        })

        const run_fn = () => {
            render_num++
            ani_context.forEach(v => {
                if (render_num === render_count - 1) v.index = v.path.length - 1
                const last_path = v.path[v.index - 1]
                const now_path = v.path[v.index]
                const next_path = v.path[v.index + 1]
                let path_angle = next_path ? this.getAngle(now_path, next_path) : this.getAngle(last_path, now_path)
                v.index = Math.floor(v.speed * render_num)
                v.icon.style = `
                    transform: translate(-50%, -50%) rotate(${path_angle}deg); 
                    position: absolute; 
                    top: ${now_path[1]}px; 
                    left: ${now_path[0]}px; 
                    display: block;
                    transition: .05s all;
                `
            })
            if (render_num < render_count) requestAnimationFrame(run_fn)
            else {
                console.log(ani_context)
            }
        }
        run_fn()
    }

    setAniConfig(config) {
        this.ani_config = {
            ... this.ani_config,
            ... config,

        }

        this.preLoadIcon()

    }

    preLoadIcon() {
        const { size } = this.ani_config
        this.icon_list.forEach(v => {
            v.remove()
        })
        this.icon_list = this.ani_config.icon.map(v => {
            const image = new Image(size[0], size[1])
            const div = document.createElement("div")
            div.style.position = "absolute"
            div.style.display = "none"
            image.src = v
            div.appendChild(image)
            this.target.appendChild(div)
            return div
        })

    }

    getAngle(a, b) {
        const radian = Math.atan2(b[1] - a[1], b[0] - a[0])
        return 180 / Math.PI * radian
    }

}