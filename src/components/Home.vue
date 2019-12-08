<template>
  <div class="full-height">
    <el-tabs type="border-card" class="my-tab">
      <el-tab-pane :label="fileName">
        <prism-editor
          ref="rbq"
          v-model="code"
          :code="code"
          language="java"
          :line-numbers="lineNumbers"
          v-on:change="onCodeChange"
          class="editor"
        />
      </el-tab-pane>
      <el-tab-pane class="my-tab">
        <span slot="label"><i class="el-icon-upload2"></i></span>
        <div style="height: 40px"></div>
        <el-upload
          drag
          action="https://jsonplaceholder.typicode.com/posts/"
          :file-list="files"
          :on-change="onFileChange"
          :auto-upload="false"
          :limit="1"
          multiple>
          <div class="absolute-center">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text color-white">将文件拖到此处，或<em>点击上传</em></div>
          </div>
          <div class="el-upload__tip color-white" slot="tip">只能上传jpg/png文件，且不超过500kb</div>
        </el-upload>
      </el-tab-pane>
    </el-tabs>
    <el-card
      class="commend-list"
      v-bind:style="{top: listSize.top + 'px', left: listSize.left + 'px', width: listSize.width + 'px', height: listSize.height + 'px'}"
      v-if="showCommend"
      shadow="always"
      :body-style="{padding: '2px'}"
      v-click-outside="onClickOutside"
    >
      <ul class="infinite-list" style="overflow:auto">
        <div v-for="(item, index) in recommends" v-bind:key="index">
          <li
            v-bind:class="index === currentRec ? 'infinite-list-item-active' : 'infinite-list-item'"
            v-on:click="clickFill(item)"
          >{{ item }}</li>
        </div>
      </ul>
    </el-card>
    <el-button class="switch-btn" v-if="backEnd === 'ngram'" v-on:click="switchBackEnd()">N-Gram模型</el-button>
    <el-button class="switch-btn" v-if="backEnd === 'lstm'" v-on:click="switchBackEnd()">LSTM模型</el-button>
    <el-button class="rec-btn" v-if="realtime === true" v-on:click="realtime = !realtime">即时推荐</el-button>
    <el-button class="rec-btn" v-if="realtime === false" v-on:click="realtime = !realtime">手动推荐</el-button>
  </div>
</template>

<script>
import PrismEditor from "vue-prism-editor"
import { getSelectionCoords } from "../utils"
import vClickOutside from 'v-click-outside'
import axios from 'axios'
const ngramModel = axios.create({
  baseURL: 'http://10.144.4.121:8080/',
  headers: {'Access-Control-Allow-Origin': '*'},
  withCredentials: false
});
const lstmModel = axios.create({
  baseURL: 'http://10.141.221.246:8000/',
  headers: {'Access-Control-Allow-Origin': '*'},
  withCredentials: false
});
// axios.defaults.baseURL = 'http://10.144.4.121:8080/'
// axios.defaults.headers = {
//     'Access-Control-Allow-Origin': '*'
// }
// axios.defaults.withCredentials = false
// axios.defaults.crossDomain = true

export default {
  name: 'Home',
  components: {
    PrismEditor
  },
  directives: {
    clickOutside: vClickOutside.directive
  },
  data() {
    return {
      code: null,
      fileName: 'untitled',
      lineNumbers: true,
      showCommend: false,
      files: [],
      listSize: {
        width: 300,
        height: 150,
        top: 0,
        left: 0
      },
      windowSize: {
        width: 0,
        height: 0
      },
      currentSelection: 0,
      recommends: ['No recommend'],
      currentRec: 0,
      isFill: false,
      backEnd: 'ngram',
      realtime: true
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
    const that = this
    document.addEventListener("selectionchange", function(evt) { 
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const node = selection.getRangeAt(0).startContainer.parentNode
        if(node.tagName === 'CODE'){
          that.currentSelection = window.getSelection().baseOffset
        }
      }
    })
    // bind keyboard event
    document.onkeydown = function(e) {
      if (that.showCommend === false){
        if (that.realtime === true) return
        if (e.altKey && e.keyCode == '67') {
          e.preventDefault()
          e.stopPropagation()
          if (that.backEnd === 'ngram') {
            ngramModel.get('/getPredict10Tokens', {
              params: {
                content: that.code
              }
            })
            .then(function (response) {
              let tokens = response.data
              // console.log(tokens)
              if (tokens.length === 0) return
              else if(tokens.length > 6) {
                tokens = tokens.slice(0, 6)
              }
              that.recommends = tokens
              console.log(tokens)
              that.prepareCommendBox()
              that.showCommend = true
              return
            })
            .catch(function (error) {
              console.log(error)
              return
            })
          }
          else {
            lstmModel.get('/', {
              params: {
                t: that.code
              }
            })
            .then(function (response) {
              let tokens = response.data
              // console.log(tokens)
              if (tokens.length === 0) return
              else if(tokens.length > 6) {
                tokens = tokens.slice(0, 6)
              }
              that.recommends = tokens
              console.log(tokens)
              that.prepareCommendBox()
              that.showCommend = true
              return
            })
            .catch(function (error) {
              console.log(error)
              return
            })
          }
        }
        return
      }
      if (e.keyCode == '38') {
        that.currentRec = that.currentRec === 0 ? 0 : that.currentRec - 1
        e.stopPropagation()
        e.preventDefault()
      }
      else if (e.keyCode == '40') {
        that.currentRec = that.currentRec === that.recommends.length - 1 ? that.recommends.length - 1 : that.currentRec + 1
        e.stopPropagation()
        e.preventDefault()
      }
      else if (e.keyCode == '13') {
        e.preventDefault()
        e.stopPropagation()
        that.clickFill(that.recommends[that.currentRec])
      }
      else {
        that.showCommend = false
      }
    }

    // set style
    document.querySelector('div.el-tabs__nav-scroll').style.backgroundColor = 'black'
    setInterval(() => { 
      const tab_nav = document.querySelector('div.el-tabs__nav')
      const tabs = tab_nav.querySelectorAll('div')
      for(let i = 0; i < tabs.length; i ++) {
        if (tabs[i].classList.contains('is-active')) {
          tabs[i].style.backgroundColor = '#2d2d2d'
          tabs[i].style.border = '0px'
          tabs[i].style.borderRadius = '10px 10px 0 0'
          tabs[i].style.color = 'white'
        }
        else {
          tabs[i].style.backgroundColor = ''
          tabs[i].style.border = ''
          tabs[i].style.borderRadius = ''
          tabs[i].style.color = 'white'
        }
      }
    }, 100)
    document.querySelector('div.el-upload-dragger').style.backgroundColor = '#2d2d2d'
    document.querySelector('div.el-upload-dragger').style.width = this.windowSize.width - 200 + 'px'
    document.querySelector('div.el-upload-dragger').style.height = this.windowSize.height - 200 + 'px'
    document.querySelector('div.el-tabs__content').style.padding = '0'
    document.querySelector('div.el-tabs__content').style.backgroundColor = '#2d2d2d'
  },
  methods: {
    switchBackEnd() {
      this.backEnd = this.backEnd === 'ngram' ? 'lstm' : 'ngram'
    },
    prepareCommendBox() {
      const x_pad = 5
      const y_pad = 25
      const coord = getSelectionCoords()
      const offset_y = Math.ceil(coord.y)
      if (offset_y + this.listSize.height + y_pad > this.windowSize.height){
        this.listSize.top = offset_y - this.listSize.height - y_pad
      }
      else this.listSize.top = offset_y + y_pad
      const offset_x = Math.ceil(coord.x)
      if (offset_x + this.listSize.width + x_pad > this.windowSize.width){
        this.listSize.left = this.windowSize.width - this.listSize.width - x_pad
      }
      else this.listSize.left = offset_x + x_pad
      // if (this.isFill === true){
      //   this.showCommend = false
      //   this.isFill = false
      // }
    },
    onCodeChange(code) {
      // do nothing
      const that = this
      if (this.realtime) {
        if (that.backEnd === 'ngram') {
          ngramModel.get('/getPredict10Tokens', {
            params: {
              content: that.code
            }
          })
          .then(function (response) {
            let tokens = response.data
            // console.log(tokens)
            if (tokens.length === 0) return
            else if(tokens.length > 6) {
              tokens = tokens.slice(0, 6)
            }
            that.recommends = tokens
            console.log(tokens)
            that.prepareCommendBox()
            that.showCommend = true
            return
          })
          .catch(function (error) {
            console.log(error)
            return
          })
        }
        else {
          lstmModel.get('/', {
            params: {
              t: that.code
            }
          })
          .then(function (response) {
            let tokens = response.data
            // console.log(tokens)
            if (tokens.length === 0) return
            else if(tokens.length > 6) {
              tokens = tokens.slice(0, 6)
            }
            that.recommends = tokens
            console.log(tokens)
            that.prepareCommendBox()
            that.showCommend = true
            return
          })
          .catch(function (error) {
            console.log(error)
            return
          })
        }
      }
    },
    handleResize() {
      this.windowSize.width = window.innerWidth
      this.windowSize.height = window.innerHeight
    },
    clickFill(word) {
      // console.log(this.currentSelection)
      const node = document.getElementsByTagName('code')[0]
      node.focus()
      const cur = window.getSelection().baseOffset
      // this.isFill = true
      this.showCommend = false
      this.code += word

      // const node = document.getElementsByTagName('code')[0]
      // node.focus()
      // const evtObj = document.createEvent('UIEvents'); 
      // evtObj.initUIEvent( 'keydown', true, true, window, 1 );
      // delete evtObj.keyCode;
      // Object.defineProperty(evtObj,"keyCode",{value:37});
      // node.dispatchEvent(evtObj)
    },
    onFileChange(file, fileList) {
      const reader = new FileReader()
      const that = this
      reader.onload = function (event) {
        // console.log(event.target.result)
        that.code = event.target.result
        that.fileName = file.name
      }
      reader.readAsText(file.raw)
    },
    onClickOutside() {
      this.showCommend = false
    }
  }
}
</script>

<style scoped>
.rec-btn {
  position: fixed;
  bottom: 20px;
  right: 160px;
}
.switch-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
}
.full-height {
  height: 100%;
}
.editor {
  height: 100%;
}
.commend-list {
  position: absolute;
  border: 0px solid #3a4750;  
  background-color: #303841;
  padding: 0;
}
.infinite-list {
  padding: 0;
  margin: 0;
  list-style: none;
}
.infinite-list-item {
  display: flex;
  align-items: center;
  height: 25px;
  text-align: left;
  padding-left: 10px;
  padding-right: 10px;
  margin: 0px;
  color: #eeeeee;
}
.infinite-list-item-active {
  display: flex;
  border-radius: 1px;
  align-items: center;
  height: 25px;
  text-align: left;
  background: #f6c90e;
  padding-left: 10px;
  padding-right: 10px;
  margin: 0px;
  color: #303841;
}
.infinite-list-item:hover {
  border-radius: 1px;
  background: #c2e8ce;
  color: #303841;
}
.my-tab {
  height: 100%;
  background-color: #2d2d2d;
}
.absolute-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.color-white {
  color: white !important;
}
</style>