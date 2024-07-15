import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, ListGroup, ListGroupItem } from "reactstrap";
class ModalBodyRequest extends Component{
	
    constructor(props){
        super(props);
		this.handleClose = this.handleClose.bind(this);
		this.state={
            show:false,
            body:null,
        }
    }

	isDataChange(prev_data, new_data){
		if(prev_data.show !== new_data.show)
			return true;
		if(prev_data.body !== new_data.body)
			return true;
		return false;
	}

	componentDidMount() {
        let data = this.props.data?this.props.data:this.state;
		this.reset(data);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.isDataChange(prevProps.data,this.props.data)) {
			this.reset(this.props.data);
		}
	}

	reset(data){
		let show = data.show!==undefined?data.show:this.state.show;
		let body = data.body!==undefined?data.body:this.state.body;
		this.setState({
			show: show,
			body: body,
		});
	}

	handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	render(){
		const { body, show, response } = this.state;
		return(
			<Modal
				isOpen={show}
				backdrop="static"
				keyboard={false}>
				<ModalHeader className="text-center">Consulta de Api</ModalHeader>
				<ModalBody className="text-center">
                    <h6>{body}</h6>
				</ModalBody>
				<ModalFooter>
					<Button color="warning" onClick={this.handleClose}>
						Aceptar
					</Button>
				</ModalFooter>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalBodyRequest {...props} history={history} />;
}