
import UploaderTemplate from './uploader.vue'
import WebUploaderIns from './webUpload';
import http from '../../axiosConfig/http'

function _renderSize(filesize){
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
}

// 上传工具类
class UploadUtil {
	constructor(instance) {
		if(!instance) {
			console.error('未提供上传DOM实例')
		}
		this.uploadListObj = {};	// 保存上传的列表状态
		this.webUploaderList = []; // 上传实例的数组
		this.uploadInterval = undefined; // 刷新上传进度的定时器
		this.uploaderInstance = instance;
		this.uploaderInstance.uploadShowList = [];
		this.uploaderInstance.$on('suspendUpload', this.suspendUpload)
		this.uploaderInstance.$on('endUpload', this.endUpload)
		this.uploaderInstance.$on('restartUpload', this.restartUpload)
	}
	/**
	 * 
	 * @param {FormData} params { file: 必传, name, size }
	 */
	addTask(params = {}) {
		if(!params.file) {
			console.error('上传文件必要')
			return;
		}
		this.uploaderInstance.isShow = true;
		// 创建不同的上传实例 避免进度共享
		const WebUploader = new WebUploaderIns({url: 'http://192.168.2.32:8084/api/v1/receive/filearchive/uploadFile'}); // TODO 暂时写死 根据项目去改变
		const uuid = new Date().getTime();
		WebUploader.addFiles(params.file) // 添加上传任务
		if(!this.uploadInterval) this.setUploadInterval() // 开始进行进度刷新
		this.webUploaderList.push({ uuid, WebUploader }) // 保存起来方便之后的操做
		this.uploadListObj[uuid] = { // 显示的上传列表
			uuid,
			// file: params.file,
			name: params.name || '--',
			fileName: params.file.name,
			size: _renderSize(params.file.size) || '--',
			fileSize: params.file.size,
			status : 1,
			progress: 0
		}
		// 上传进度
		WebUploader.uploadProgress((file, percentage) => {
			this.uploadListObj = {
				...this.uploadListObj,
				[uuid]: {
					...this.uploadListObj[uuid],
					oldProgress: this.uploadListObj[uuid].progress,
					progress: Number((percentage * 100).toFixed(2)),
				}
			}
		})
		const _deleteUploader = (uuid) => {
			let findIndex = -1;
			this.webUploaderList.forEach((up, index) => {
				if(up.uuid == uuid) {
					findIndex = index;
				}
			})
			if(findIndex != -1) {
				this.webUploaderList.splice(findIndex, 1);
			}
		}
		// 上传出问题
		WebUploader.uploadError(() => {
			// 将某一条数据标记未上传失败
			this.uploadListObj = {
				...this.uploadListObj,
				[uuid]: {
					...this.uploadListObj[uuid],
					status: -1,
				}
			}
			_deleteUploader(uuid)
		})
		// 上传成功
		WebUploader.uploadSuccess(file => {
			// 某一条数据上传成功 首先进行合并
			const formData = new FormData();
			formData.append('targetId', 'b6f9587dd61a47c0a73565cab9dfbabb')
			formData.append('fileName', params.name)
			http.post('http://192.168.2.32:8084/api/v1/receive/filearchive/mergeChunks', formData).then(res => {
				if(res.data.success) {
					_deleteUploader(uuid)
					this.uploadListObj = {
						...this.uploadListObj,
						[uuid]: {
							...this.uploadListObj[uuid],
							status: 2,
						}
					}
				} else {
					// 合并出错
					this.uploadListObj = {
						...this.uploadListObj,
						[uuid]: {
							...this.uploadListObj[uuid],
							status: -1,
						}
					}
					_deleteUploader(uuid)
				}
			}).catch(err => {
				this.uploadListObj = {
					...this.uploadListObj,
					[uuid]: {
						...this.uploadListObj[uuid],
						status: -1,
					}
				}
				_deleteUploader(uuid)
			})
		})
	}
	// 暂停某个上传任务
	suspendUpload(item) {
		this.$uploadUtil.webUploaderList.forEach((up, index) => {
			if(up.uuid == item.uuid) {
				up.WebUploader.uploader.stop(true)
				this.$uploadUtil.uploadListObj[item.uuid] = {
					...this.$uploadUtil.uploadListObj[item.uuid],
					status: 0
				}
			}
		})
	}
	// 重新开始某个上传任务
	restartUpload(item) {
		this.$uploadUtil.webUploaderList.forEach((up, index) => {
			if(up.uuid == item.uuid) {
				up.WebUploader.uploader.upload()
				this.$uploadUtil.uploadListObj[item.uuid] = {
					...this.$uploadUtil.uploadListObj[item.uuid],
					status: 1
				}
			}
		})
	}
	// 终止某个上传任务
	endUpload(item) {
		let findIndex = -1;
		this.$uploadUtil.webUploaderList.forEach((up, index) => {
			if(up.uuid == item.uuid) {
				findIndex = index;
			}
		})
		if(findIndex != -1) {
			this.$uploadUtil.webUploaderList.splice(findIndex, 1);
			let obj = { ...this.$uploadUtil.uploadListObj }
			delete obj[item.uuid]
			this.$uploadUtil.uploadListObj = obj
		}
	}
	setUploadInterval() { 
		this.uploadInterval = setInterval(() => {
			this.uploaderInstance.uploadShowList = Object.keys(this.uploadListObj).map((item) => {
				return this.uploadListObj[item]
			}) || []
			if(this.webUploaderList.length == 0) {
				// 没有上传任务 终止计时器
				window.clearInterval(this.uploadInterval)
				this.uploadInterval = '';
			}
		}, 500)
	}
}


// 构造Vue插件
const UploadList = {}

UploadList.install = function (Vue) {
	// 创建容器DOM
	let uploadInstance = undefined;
	const uploadConstructot = Vue.extend(UploaderTemplate);
	uploadInstance = new uploadConstructot();
	uploadInstance.$mount(document.createElement('div'))
	document.body.appendChild(uploadInstance.$el);
	// 容器DOM创建结束
	let uploadUtil = new UploadUtil(uploadInstance);
	Vue.prototype.$uploadUtil = uploadUtil;
}



export default UploadList