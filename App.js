import React, { Component } from 'react';
import { View, NativeModules, Platform, PermissionsAndroid } from 'react-native'
import { RtcEngine, AgoraView } from 'react-native-agora';
import Icon from 'react-native-vector-icons/MaterialIcons';
import requestCameraAndAudioPermission from './permission'

const { Agora } = NativeModules;

const {
	FPS30,
	AudioProfileDefault,
	AudioScenarioDefault,
	Host,
	Adaptative
} = Agora;

const iconStyle = {
	fontSize: 34,
	marginTop: 8,
	marginLeft: 15,
	marginRight: 15,
	borderRadius: 0
}

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			peerIds: [],
			uid: Math.floor(Math.random() * 100),
			peerIds: [],
			appid:'<-----appid----->',
			channelName: 'channel-x',
			vidMute: false,
			audMute: false,
			joinSucceed: false
		};
	}

	componentWillMount() {
		if (Platform.OS === 'android') {
			requestCameraAndAudioPermission().then(_ => {
				console.log("requested!");
			});
			const config = {
				appid: this.state.appid,
				channelProfile: 0,                    // 0 for rtc 1 for live broadcasting
				// clientRole: Host,                     Set if live broadcasting mode is enabled
				videoEncoderConfig: {
					width: 720,
					height: 1080,
					bitrate: 1,
					frameRate: FPS30,
					orientationMode: Adaptative,
				},
				audioProfile: AudioProfileDefault,
				audioScenario: AudioScenarioDefault
			}
			RtcEngine.on('userJoined', (data) => {
				console.log('[RtcEngine] onUserJoined', data);
				const { peerIds } = this.state;
				if (peerIds.indexOf(data.uid) === -1) {
					this.setState({
						peerIds: [...peerIds, data.uid]
					})
				}
			});
			RtcEngine.on('userOffline', (data) => {
				console.log('[RtcEngine] onUserOffline', data);
				this.setState({
					peerIds: this.state.peerIds.filter(uid => uid !== data.uid)
				})
				console.log('peerIds', this.state.peerIds, 'data.uid ', data.uid)
			});
			RtcEngine.on('joinChannelSuccess', (data) => {
				console.log('[RtcEngine] onJoinChannelSuccess', data);
				RtcEngine.startPreview();
				this.setState({
					joinSucceed: true
				})
			});
			RtcEngine.init(config);
			console.log("will mount")
		}

	}

	componentDidMount() {
		RtcEngine.getSdkVersion((version) => {
			console.log('[RtcEngine] getSdkVersion', version);
		})

		console.log('[joinChannel] ' + this.state.channelName);
		RtcEngine.joinChannel(this.state.channelName, this.state.uid);
		RtcEngine.enableAudio();
	}

	toggleAudio = () => {
		let mute = this.state.audMute;
		console.log("Audio toggle", mute)
		RtcEngine.muteLocalAudioStream(!mute)
		this.setState({
			audMute: !mute
		});
	}

	toggleVideo = () => {
		let mute = this.state.vidMute;
		console.log("Video toggle", mute)
		this.setState({
			vidMute: !mute
		})
		RtcEngine.muteLocalVideoStream(!this.state.vidMute)
	}

	endCall() {
		if (this.state.joinSucceed) {
			RtcEngine.leaveChannel().then(res => {
				RtcEngine.removeAllListeners();
				RtcEngine.destroy();
			}).catch(err => {
				RtcEngine.removeAllListeners();
				RtcEngine.destroy();
				console.log("leave channel failed", err);
			})
		} else {
			RtcEngine.removeAllListeners();
			RtcEngine.destroy();
		}
	}

	render() {
		return (
			<View style={{
				flex: 1
			}}>

				{
					this.state.peerIds.length > 0 ?
						<AgoraView style={{
							flex: 1
						}} remoteUid={this.state.peerIds[0]} mode={1} /> : <View />
				}
				{
					!this.state.vidMute ?
						<AgoraView style={{
							width: 240,
							height: 140,
							position: "absolute",
							top: 5,
							right: 5,
							zIndex: 100
						}} zOrderMediaOverlay={true} showLocalVideo={true} mode={1} /> : <View />
				}
				<View style={{
					height: 50,
					backgroundColor: '#007AFF',
					display: 'flex',
					width: "100%",
					position: "absolute",
					bottom: 0,
					left: 0,
					flexDirection: "row",
					justifyContent: "center",
					alignContent: "center"
				}}>

					<Icon.Button style={iconStyle}
						name={this.state.audMute ? "mic-off" : "mic"}
						onPress={() => this.toggleAudio()}
					></Icon.Button>

					<Icon.Button style={iconStyle}
						name="call-end"
						onPress={() => this.endCall()}
					></Icon.Button>
					<Icon.Button style={iconStyle}
						name={this.state.vidMute ? "videocam-off" : "videocam"}
						onPress={() => this.toggleVideo()}
					></Icon.Button>
				</View>
			</View>
		)
	}
}