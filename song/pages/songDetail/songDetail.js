// pages/songDetail/songDetail.js
import PubSub from 'pubsub-js'
import request from '../../../utils/request'
import moment from 'moment'
//获取全局实例
const appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false,//音乐是否播放
    song: {},//歌曲详情对象
    musicId: '',//音乐id
    musicLink: '',//音乐的连接
    currentTime: '00:00', //实时初始化显示时间
    durationTime: '00:00',//总时间长
    currentWidth: 0,//实时进度条的宽度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //options接收路由传参的query参数
    //原生小程序中路由传参，对参数的长度有限制，如果参数长度过长会自动截取掉
    // console.log(JSON.parse(options.song));
    let musicId = options.musicId
    this.setData({
      musicId: musicId
    })
    //获取音乐的详情
    this.getMusicInfo(musicId)
    // 问题：如果用户操作系统的控制音乐播放/暂停的按钮，页面不知道，导致页面显示是否播放的状态和真实的音乐播放状态不一致
    // 解决方案：
    // 1.通过控制音频的实例区监视音乐播放/暂停/停止
    //判断当前页面音乐是否在播放
    if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId === musicId) {
      //修改当前页面音乐播放的状态
      this.setData({
        isPlay: true
      })
    }
    //创建控制音乐播放的实例
    this.backgroundAudioManager = wx.getBackgroundAudioManager()
    this.backgroundAudioManager.onPlay(() => {
      //修改音乐是否的状态
      this.changePlayState(true)
      //修改全局音乐播放的状态
      appInstance.globalData.musicId = musicId
    })
    this.backgroundAudioManager.onPause(() => {
      this.changePlayState(false)
    })
    this.backgroundAudioManager.onStop(() => {
      this.changePlayState(false)
    })
    //监听音乐播放自然结束
    this.backgroundAudioManager.onEnded(() => {
      //自动切换至下一首音乐，并且自动播放
      PubSub.publish('switchType', 'next')
      PubSub.subscribe("musicId", (msg, musicId) => {
        this.getMusicInfo(musicId)
        this.musicControl(true, musicId)
        PubSub.unsubscribe("musicId")
      })
      //自动播放当前的音乐
      //将实时进度条的长度还原成0,时间还原成0
      this.setData({
        currentWidth: 0,
        currentTime: '00:00'
      })
    })

    //监听音乐实时播放的进度
    this.backgroundAudioManager.onTimeUpdate(() => {
      //console.log(this.backgroundAudioManager.duration);
      //格式化实时的播放时间
      let currentTime = moment(this.backgroundAudioManager.currentTime * 1000).format('mm:ss')
      let currentWidth = this.backgroundAudioManager.currentTime / this.backgroundAudioManager.duration * 450
      this.setData({
        currentTime,
        currentWidth
      })
    });
  },
  //修改播放状态的功能函数
  changePlayState(isPlay) {
    this.setData({
      isPlay
    })
    //修改全局音乐播放的状态
    appInstance.globalData.isMusicPlay = isPlay
  },
  //获取音乐详情的功能函数
  async getMusicInfo(musicId) {
    let songData = await request('/song/detail', { ids: musicId })
    let durationTime = moment(songData.songs[0].dt).format('mm:ss')
    //song: songData.songs[0].dt//播放时间
    this.setData({
      song: songData.songs[0],
      durationTime
    })
    //动态修改窗口标题
    wx.setNavigationBarTitle({
      title: this.data.song.name
    })
  },
  //点击播放/暂停的回调
  musicPlay() {
    let isPlay = !this.data.isPlay
    //修改是否播放的状态
    // this.setData({
    // isPlay
    // })
    let { musicId, musicLink } = this.data
    this.musicControl(isPlay, musicId, musicLink)
  },
  //控制音乐播放/暂停的功能函数
  async musicControl(isPlay, musicId, musicLink) {
    if (isPlay) {// 音乐播放
      if (!musicLink) {
        //获取音乐播放链接
        let musicLinkData = await request('/song/url', { id: musicId })
        musicLink = musicLinkData.data[0].url

        this.setData({
          musicLink
        })
      }
      //创建控制音乐播放的实例
      this.backgroundAudioManager.src = musicLink
      this.backgroundAudioManager.title = this.data.song.name
    } else {//暂停音乐
      this.backgroundAudioManager.pause()
    }

  },
  //点击切换的回调
  handleSwitch(event) {
    //获取切歌的类型
    let type = event.currentTarget.id
    //关闭当前播放的音乐
    this.backgroundAudioManager.stop()
    // console.log(type);
    //订阅来自recommendsong页面发布的musicId消息
    PubSub.subscribe('musicId', (msg, musicId) => {
      // console.log(musicId);
      //自动播放当前的音乐
      this.musicControl(true, musicId)
      //取消订阅
      PubSub.unsubscribe('musicId')
    })
    //发布消息数据给recommendSong页面
    PubSub.publish('switchType', type)
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})