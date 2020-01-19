
export default class VueUploader {
	toString() {
		
	}
	constructor({ url = '', fileQueuedFn = () => {} } = {}) {
		if(!url) {
			console.error('切片上传url必传')
			return;
		}
		this.uploader = ''
		this.url = url
		this.uploadInit()
		this.fileQueuedFn = fileQueuedFn
		this.queue = []
	}
	uploadInit() {
		this.uploader = WebUploader.create({
			swf: '/Uploader.swf',
			// 开起分片上传。
			chunked: true,
			server: this.url,
			fileNumLimit: 1,
			chunkSize: 2048000,
			duplicate: true,
			threads: 1,
			auto: true
		})
		// this.uploader.on('uploadBeforeSend', function (obj, data) {
    //   data = $.extend(data, that.formData);
    // });
    // this.uploadError()
		this.uploader.on('uploadFinished', (file) => {
			this.uploader.reset()
		})
	}
	startUpload() {
		let that = this
		that.uploader.on('startUpload', (file) => {
			that.fileQueuedFn(file)
		})
	}
	/**
   *
   *
   * @memberof VueUploader
   * @file {File}File对象
   */
	beforeFileQueued() {
		let that = this
		that.uploader.on('beforeFileQueued', (file) => {
			// TODO:任务被加入队列之前 判断大小等
		})
	}

	/**
   *
   *
   * @memberof VueUploader
   * @file {File}File对象
   */
	fileQueued() {
		// TODO:任务被加入队列之后
		let that = this
		that.uploader.on('fileQueued', (file) => {})
	}
	/**
   *
   *
   * @memberof VueUploader
   * @file {File}File对象
   */
	fileDequeued() {
		let that = this
		that.uploader.on('fileDequeued', (file) => {
			// TODO:当文件被移除队列后触发。
		})
	}

	uploadStart() {
		let that = this
		that.uploader.on('uploadStart', (file) => {
			// TODO:某个文件开始上传前触发，一个文件只会触发一次
			let index = that.queue.findIndex((v) => (v.file.name = file.name))
			that.queue.splice(index, 1)
		})
	}
	/**
   *
   *
   * @memberof VueUploader
   * @file {File}File对象
   *@percentage {Number}上传进度
   */
	uploadProgress(callBack) {
		let that = this
		that.uploader.on('uploadProgress', (file, percentage) => {
			// TODO:上传过程中触发，携带上传进度。
			callBack(file, percentage)
		})
	}
	/**
   *
   *
   * @memberof VueUploader
   * @reason {String}出错的code
   * @file {File}File对象
   */
	uploadError(callBack) {
		let that = this
		that.uploader.on('uploadError', (file, reason) => {
			let fileName = file.name
			that.uploader.reset()
			if (callBack instanceof Function) {
				callBack(fileName, reason)
			}
		})
	}
	/**
   *
   *
   * @memberof VueUploader
   * @file {File}File对象
   *@response {Object}服务端返回的数据
   */
	uploadSuccess(callBack) {
		let that = this
		that.uploader.on('uploadSuccess', (file, reason) => {
			// TODO:当文件上传成功时触发。
			// that.uploader.reset()
			that.uploader.destroy() // 防止重复上传报错
			that.uploadInit() // 防止重复上传报错
			if (callBack instanceof Function) {
				callBack(file, reason)
			}
		})
	}
	/**
   *
   *
   * @memberof VueUploader
   * @file {File} [可选]File对象
   */
	uploadComplete() {
		let that = this
		that.uploader.on('uploadComplete', (file, reason) => {
			// TODO:不管成功或者失败，文件上传完成时触发。

		})
	}
	getStatsFn() {
		return this.uploader.getStats()
	}
	addFiles(parms) {
		// 添加队列
		var runtimeForRuid = new WebUploader.Runtime.Runtime();
		var wuFile = new WebUploader.File(new WebUploader.Lib.File(WebUploader.guid('rt_'),parms));
		this.uploader.addFiles(wuFile)
	}
	removeFile(file) {
		// 移除某一文件, 默认只会标记文件状态为已取消， 如果第二个参数为 true 则会从 queue 中移除。
		this.uploader.removeFile(file)
	}
	getFiles(parms) {
		// 返回指定状态的文件集合， 不传参数将返回所有状态的文件
		this.uploader.getFiles(parms)
	}
	cancelFile() {
		this.uploader.cancelFile()
	}
	destroy() {
		this.uploader.destroy()
	}
}
