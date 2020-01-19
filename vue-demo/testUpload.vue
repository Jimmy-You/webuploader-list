<template>
	<div>
		<Upload
				:before-upload="handleUpload"
				action="//jsonplaceholder.typicode.com/posts/">
				<Button icon="ios-cloud-upload-outline">Select the file to upload</Button>
		</Upload>
		<input webkitdirectory type="file" @change="handleUpLoadFiles" />
		<Button @click="upload">上传</Button>
	</div>
</template>
<script>
export default {
	data() {
		return {
			file: undefined,
		}
	},
	methods: {
		handleUpload(file) {
			this.file = file;
			return false;
		},
		handleUpLoadFiles(e) {
			this.file = e.target.files;
		},
		upload() {
			if(this.file.length) {
				for(let i=0;i<this.file.length;i++) {
					this.$uploadUtil.addTask({
						name: '测试上传任务' + i,
						file: this.file[i]
					})
				}
			} else {
				this.$uploadUtil.addTask({
					name: '测试上传任务',
					file: this.file
				})
			}
		}
	}
}
</script>