<script setup>
import { ref, onMounted } from "vue"
import { throttle } from "lodash-es"
import { RenderPathAni } from "./util/canvas"

let render_path_instance = null

const handle_color_input_change = function(event) {
    const val = event.target.value
    render_path_instance.setConfig({
        color: val
    })
}

onMounted(() => {
    render_path_instance = new RenderPathAni("render-path")
    render_path_instance.setConfig({
        size: 5
    })

    render_path_instance.setAniConfig({
        icon: [
            "https://g.csdnimg.cn/common/csdn-footer/images/cs.png",
            "https://echarts.apache.org/zh/asset/lottie/json/images/img_1.png",
            "https://g.csdnimg.cn/common/csdn-footer/images/cs.png",
            "https://g.csdnimg.cn/common/csdn-footer/images/cs.png",
            "https://g.csdnimg.cn/common/csdn-footer/images/cs.png",
            "https://g.csdnimg.cn/common/csdn-footer/images/cs.png",
            "https://g.csdnimg.cn/common/csdn-footer/images/cs.png",
        ],
    })


    render_path_instance.on("save", () => {
        console.log("save")
        console.log(render_path_instance)
    })
})
</script>

<template>
    <div id="render-path" ></div>
    <button @click="render_path_instance.backoutStore">撤销</button>
    <button @click="render_path_instance.renderIconToPath">动画</button>
    <input type="color" @change="handle_color_input_change" />
</template>

<style scoped>
#render-path {
    width: 500px;
    height: 500px;
    border: 1px solid #ccc;
}
</style>
