import React, { Component, createRef } from 'react';
import Peer from 'peerjs';

import cn from 'classnames';

import styles from './styles.module.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.peerId = parseInt(Math.random() * 1e4, 10).toString(16);

    this.peer = new Peer(this.peerId, {
      config: {
        iceServers: [{ url: 'stun:stun.l.google.com:19302' }],
      },
      host: 'pjss.herokuapp.com',
      port: 443,
      path: '/myapp',
      secure: true,
    });

    this.state = {
      peerId: this.peerId,
      partnerPeerId: '',
      connectionState: null,
      connection: null
    };
  }

  userVideoRef = createRef();
  partnerVideoRef = createRef();

  componentDidMount() {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
  }

  getMedia(options, success, error) {
    navigator.getUserMedia(options, success, error);
  }

  onReceiveCall(call) {
    this.getMedia(
      { audio: true, video: true },
      (stream) => {
        console.log('answering..');

        call.answer(stream);
        this.setState({ connectionState: 'inCall' });
      },
      (err) => console.log(err)
    );

    call.on('stream', (stream) => {
      console.log('Stream recivied');
      var video = this.partnerVideoRef.current;
      video.srcObject = stream;
    });
  }

  prepareSelfVideo = () => {
    this.getMedia(
      { audio: false, video: true },
      (stream) => {
        var video = this.userVideoRef.current;
        video.srcObject = stream;
      },
      (err) => console.log(err)
    );
  };

  onReceiveStream = (stream) => {
    var video = this.partnerVideoRef.current;
    video.srcObject = stream;
    this.setState({ connectionState: 'inCall' });
  };

  call(id) {
    this.getMedia(
      { audio: true, video: true },
      (stream) => {
        var call = this.peer.call(id, stream);
        console.log('calling..');
        this.setState({ connectionState: 'calling' });

        console.log(call);
        call.on('stream', this.onReceiveStream);
      },
      (err) => console.log(err)
    );
  }

  componentWillUnmount() {
    this.peer.disconnect();
  }

  inputChangeHandler = (e) => {
    this.setState({ partnerPeerId: e.target.value }, () => {});
  };

  handleConnect = () => {
    this.prepareSelfVideo();

    console.log('Trying to connect');

    var conn = this.peer.connect(this.state.partnerPeerId, { reliable: true });

    this.setState({connection: conn});

    conn.on('open', (id) => {
      console.log('Peer ID: ' + this.peerId);
      this.setState({ connectionState: 'connected' });
    });

    this.peer.on('connection', (e) => console.log('Peer connected', e));
    this.peer.on('call', this.onReceiveCall.bind(this));
  };

  handleCall = () => {
    this.call(this.state.partnerPeerId);
  };

  handleClick = () => {
    switch (this.state.connectionState) {
      case 'connected':
        this.handleCall();
        break;

      case 'inCall':
        window.location.reload();
        break;

      default:
        this.handleConnect();
        break;
    }
  };

  get buttonLabel() {
    switch (this.state.connectionState) {
      case 'connected':
        return 'Call';

      case 'inCall':
        return 'Hang Up';

      default:
        return 'Connect';
    }
  }
  render() {
    return (
      <div className={styles.wrapper}>
        <div className={styles.peerIdWrapper}> PeerID: {this.peerId}</div>
        <div className={styles.peerInputWrapper}>
          <span className={styles.peerInputLabel}>ENTER PARTNER'S PEER ID</span>
          <input className={styles.input} onChange={this.inputChangeHandler}></input>
        </div>

        <button
          className={cn(styles.button, {
            [styles.connected]: this.state.connectionState === 'connected',
            [styles.inCall]: this.state.connectionState === 'inCall',
          })}
          onClick={this.handleClick}
        >
          {this.buttonLabel}
        </button>

        {/* <button onClick={this.handleCall}>Call</button> */}

        <div className={styles.videosWrapper}>
          <div className={styles.video}>
            <span>You</span>
            <video ref={this.userVideoRef} autoPlay></video>
          </div>
          <div className={styles.video}>
            <span>Partner</span>
            <video ref={this.partnerVideoRef} autoPlay></video>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
