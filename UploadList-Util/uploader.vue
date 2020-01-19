
<template>
	<div v-show="isShow" class="uploadWrapper">
		<div class="title">
			<div>{{uploadStatus > 0 ? `正在上传${uploadStatus}个项目` : '上传列表'}}</div>
			<div class="ops">
				<div class="mini" style="margin-right:4px;">
					<img style="width:24px;" v-if="showList" src="./imgs/mini.png" @click="changeListShow" />
					<img style="width:24px;" v-else src="./imgs/full.png" @click="changeListShow" />
				</div>
				<div class="up_close">
					<img style="width:24px;" src="./imgs/close.png" @click="changeUploadShow" />
				</div>
			</div>
		</div>
		<div v-if="showInfo && uploadingMessage > 0" class="info">
			<div>有{{uploadingMessage}}个文件被暂停或上传失败</div>
			<div style="cursor:pointer;" @click="closeInfo">X</div>
		</div>
		<transition name="move">
			<div v-if="showList" class="upload_list">
				<vue-scroll v-if="uploadShowList.length">
					<div class="upload_item" v-for="(item, index) in uploadShowList" :key="index">
						<div class="item_background">
							<!-- 已经完成的进度 -->
							<div
								v-if="item.status == 1 || item.status == 0"
								class="left m_progress"
								:style="{width: `${item.progress}%`}"	
							></div> 
							<!-- 剩余的进度 -->
							<div 
								v-if="item.status == 1 || item.status == 0"
								class="right m_progress"
								:style="{width: `${100 - item.progress}%`}"	
							></div>
							<!-- 失败的背景色 -->
							<div
								v-if="item.status == -1"
								class="error m_progress"
								:style="{width: '100%'}"
							></div>
						</div>
						<div class="item_detail">
							<!-- 类型图标 -->
							<div class="icon">
								<img :src="getIcon(item)" alt="zip" />
							</div>
							<!-- 文件名称 -->
							<div class="name">{{item.name || '--'}}</div>
							<!-- 文件大小 -->
							<div class="size">
								{{item.size || '0'}}
							</div>
							<!-- 上传进度 -->
							<div class="m_progress_title">
								<span v-if="item.status == 1 && item.progress != 100">{{item.progress}}%({{getSpeed(item || 0)}}/s)</span>
								<span v-if="item.status == 0">已暂停</span>
								<span v-if="item.status == -1">错误</span>
								<span v-if="item.status == 1 && item.progress == 100">合并中...</span>
								<span v-if="item.status == 2">
									<img src="./imgs/finish.png" style="width: 22px" />
								</span>
							</div>
							<div class="ops" v-if="item.status != 2">
								<!-- 暂停 -->
								<div class="suspend icon" v-if="item.status == 1">
									<img src="./imgs/suspend.png" alt="zip" @click="handleSuspend(item)"/>
								</div>
								<!-- 开始 -->
								<div class="start icon" v-if="item.status == 0">
									<img src="./imgs/start.png" alt="zip" @click="handleRestart(item)"/>
								</div>
								<!-- 取消 -->
								<div class="cancel icon">
									<img src="./imgs/cancel.png" alt="zip" @click="handleRemoveTask(item)" />
								</div>
							</div>
						</div>
					</div>
				</vue-scroll>
				<div v-else style="height: 100%;display:flex;justify-content: center;align-items: center;">
					暂无上传任务
				</div>
			</div>
		</transition>
	</div>	
</template>
<script>
import defaultIcon from './imgs/default.png'
import excelIcon from './imgs/excel.png'
import imgIcon from './imgs/img.png'
import wordIcon from './imgs/word.png'
import zipIcon from './imgs/zip.png'
import pdfIcon from './imgs/pdf.png'

const excelType = ['xls', 'xlsx']
const wordType =  ['doc', 'docx']
const imgType = ['img', 'jpg', 'jpeg', 'tiff', 'png']
const zipType = ['zip', 'rar', 'gz']
const pdfType = [ 'pdf' ]

export default {
	data() {
		return {
			isShow: false,
			showList: true,
			showInfo: true,
			uploadShowList: [], // 展示上传进度的列表
		}
	},
	computed: {
		uploadStatus() {
			let uploading = 0;
			this.uploadShowList.forEach((item) => {
				const { status = 0 } = item;
				if(status == 1) {
					uploading += 1;
				}
			})
			return uploading;
		},
		uploadingMessage() {
			let stop = 0;
			this.uploadShowList.forEach((item) => {
				const { status = 0 } = item;
				if(status == 0 || status == -1) {
					stop += 1;
				}
			})
			return stop;
		}
	},
	methods: {
		_renderSize(filesize){
			if(null==filesize||filesize==''){
					return "0 Bytes";
			}
			var unitArr = new Array("Bytes","KB","MB","GB","TB","PB","EB","ZB","YB");
			var index=0;
			var srcsize = parseFloat(filesize);
			index=Math.floor(Math.log(srcsize)/Math.log(1024));
			var size =srcsize/Math.pow(1024,index);
			size=size.toFixed(2);//保留的小数位数
			return size+unitArr[index];
	},
	getIcon(item) {
		const fileName = item.fileName;
		const type = fileName.slice(fileName.lastIndexOf('.') + 1);
		if(zipType.find(i => i == type)) {
			return zipIcon;
		} else if(excelType.find(i => i == type)) {
			return excelIcon;
		} else if(wordType.find(i => i == type)) {
			return wordIcon;
		} else if(imgType.find(i => i == type)) {
			return imgIcon;
		} else if(pdfType.find(i => i == type)) {
			return pdfIcon;
		} else {
			return defaultIcon;
		}
	},
	closeInfo() {
		this.showInfo = false;
	},
	changeUploadShow() {
		this.isShow = false;
	},
		changeListShow() {
			this.showList = !this.showList;
		},
		handleSuspend(item) {
			this.$emit('suspendUpload', item)
		},
		handleRestart(item) {
			this.$emit('restartUpload', item)
		},
		handleRemoveTask(item) {
			this.handleSuspend(item);
			this.$Modal.confirm({
				title: '提示',
				content: `<p>是否取消任务<em>${item.name}</em></p>`,
				onOk: () => {
					this.$emit('endUpload', item)
				},
				onCancel: () => {
					this.handleRestart(item);
				}
			});
		},
		getSpeed(item) {
			// 因为是500ms更新一次  所以这个速度就按照500ms去计算
			if(item.progress && item.oldProgress) {
				const fileSize = item.fileSize || 0;
				const speed = fileSize * (item.progress - item.oldProgress) / 100 * 2
				return this._renderSize(speed)
			}
		}
	},
}
</script>
<style lang="less" scoped>
.uploadWrapper {
	position: fixed;
	bottom: 10px;
	right: 10px;
	z-index: 999;
	width: 580px;
	box-shadow: 0 0 8px #ced1d9;
	border-radius: 4px;
	.title {
		display: flex;
    padding: 0 20px;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    height: 35px;
    border-radius: 6px 6px 0 0;
		font-size: 14px;
		.ops {
			>div {
				cursor: pointer;
			}
			display: flex;
			align-items: center;
		}
	}
	.info {
		background: #62a3ff;
		height: 24px;
		line-height: 24px;
		color: #fff;
		display: flex;
		padding: 0 16px;
		justify-content: space-between;
		align-items: center;
	}
	.upload_list {
    background: #fff;
		border-radius: 4px;
		height: 250px;
		.upload_item {
			display: flex;
			border-top: 1px solid #ebebeb;
			position: relative;
			height: 55px;
			&:last-child {
				border-bottom: 1px solid #ebebeb;
			}
			.item_background {
				position: absolute;
				left: 0;
				top: 0;
				width: 100%;
				height: 55px;
				display: flex;
				z-index: 2;
				.m_progress {
					display: inline-block;
					border-radius: 0;
				}
				.left {
					background: rgba(98,163,255, 0.2)
				}
				.right {
					background: #fff;
				}
				.error {
					background: rgba(229,83,83, 0.2)
				}
			}
			.item_detail {
				display: flex;
				justify-content: space-around;
				align-items: center;
				padding: 0 8px;
				text-align: center;
				// position: absolute;
				top: 0;
				left: 0;
				height: 100%;
				z-index: 3;
				>div {
					margin: 0 4px;
				}
				.icon {
					width: 24px;
					img {
						width: 100%;
						height: auto;
					}
				}
				.name {
					width:200px;
				}
				.size {
					width: 80px;
				}
				.m_progress_title {
					width: 140px;
				}
				.ops {
					display: flex;
					width: 60px;
					justify-content: space-around;
					>div {
						cursor: pointer;
					}
				}
			}
		}
	}

	// 显影动画
	.move-enter-active, .move-leave-active {
		transition: all 0.5s;
	}
	.move-enter, .move-leave-to  {
		height: 0;
	}
}
</style>