import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup } from "reactstrap";
class ModalAlert extends Component{
	
    constructor(props){
        super(props);
		this.handleClose = this.handleClose.bind(this);
		this.handleCloseAddMore = this.handleCloseAddMore.bind(this);
		this.handleCloseError = this.handleCloseError.bind(this);
		this.state={
            title: null,
            type: '',
            message: null,
        }
    }

	isDataChange(prev_data, new_data){
		if(prev_data.title !== new_data.title)
			return true;
		if(prev_data.type !== new_data.type)
			return true;
		if(prev_data.message !== new_data.message)
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
		let title = data.title!==undefined?data.title:this.state.title;
		let type = data.type!==undefined?data.type:this.state.type;
		let message = data.message!==undefined?data.message:this.state.message;
		this.setState({
			title: title,
			type: type,
			message: message,
		});
	}

	handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
		else
			this.setState({
				message: null,
			});
	}
	

	handleCloseAddMore = (event) => {
		if(this.props.handleCloseAddMore)
			this.props.handleCloseAddMore(event);
	}

	handleCloseError = (event) => {
		if(this.props.handleCloseError)
			this.props.handleCloseError(event);
		else
			this.setState({
				message: null,
			});
	}

	render(){
		const { title, message, type } = this.state;
		const { handleCloseAddMore } = this.props;
		return(
			<Modal
				isOpen={message?true:false}
				backdrop="static"
				keyboard={false}>
				<ModalHeader className="text-center">Sistema de Operaciones y VP{title?": "+title:""}</ModalHeader>
				<ModalBody className="text-center">
					{type==="success"?<h3><i className="bi bi-check-circle-fill"></i></h3>:<></>}
					{type==="error"?<h3><i className="bi bi-exclamation-triangle-fill"></i></h3>:<></>}
					<h6>{message}</h6>
				</ModalBody>
				<ModalFooter>
					{type==="success"?
					<ButtonGroup className="my-2" size="sm">
						<Button color="success" onClick={this.handleClose}>
							Aceptar
						</Button>
						{handleCloseAddMore?
						<Button color="primary" onClick={this.handleCloseAddMore}>
							Agregar otro registro
						</Button>
						:<></>}
					</ButtonGroup>
					:<></>}
					{type==="error"?
					<Button color="warning" onClick={this.handleCloseError}>
						Aceptar
					</Button>:<></>}
				</ModalFooter>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalAlert {...props} history={history} />;
}