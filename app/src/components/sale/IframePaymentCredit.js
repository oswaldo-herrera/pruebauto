import React, { Component } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
class IframePaymentCredit extends Component {
    constructor(props) {
        super(props);
        this.iframeRef = React.createRef();
        this.state={
            view:false,
            url:""
        }
    }

    isDataChange(prev_data, new_data){
		if(prev_data.view !== new_data.view)
			return true;
        if(prev_data.url !== new_data.url)
			return true;
		return false;
	}

    componentDidMount() {
        console.log(this.iframeRef.current);
        let data = this.props.data?this.props.data:this.state;
		this.reset(data);
	}

    componentDidUpdate(prevProps, prevState) {
		if (this.isDataChange(prevProps.data,this.props.data)) {
			this.reset(this.props.data);
		}
	}

    reset(data){
        let url = data.url!==undefined?data.url:this.state.url;
        let view = data.view!==undefined?data.view:this.state.view;
        this.setState({
            url: url,
            view: view,
        },()=>{
            if(view === true){
                this.loadIframeContent().then((url) => {
                    this.props.handleComplete(url);
                })
                .catch((error) => {
                    console.error(error);
                });
            }
        });
	}

    loadIframeContent() {
        return new Promise((resolve, reject) => {
            const handleLoad = () => {
                if(this.iframeRef.current.src==="https://httpstat.us/200?sleep=3000"){
                    this.iframeRef.current.removeEventListener('load', handleLoad);
                    resolve(this.iframeRef.current.src);
                }
            };
            this.iframeRef.current.addEventListener('load', handleLoad);
            this.iframeRef.current.src = this.state.url;
        });
    }

    render() {
        const {view} = this.state;
        return (
            <iframe ref={this.iframeRef} title="miIframe" width="auto" height="400" hidden={!view}/>
        );
    }
}
export default function(props) {
    const history = useNavigate();
    return <IframePaymentCredit {...props} history={history} />;
}
