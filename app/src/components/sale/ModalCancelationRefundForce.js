import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup } from "reactstrap";
class ModalCancelationRefundForce extends Component{
	
    constructor(props){
        super(props);
		this.handleClose = this.handleClose.bind(this);
        this.handleCancelForce = this.handleCancelForce.bind(this);
        this.handleRefundForce = this.handleRefundForce.bind(this);
		this.state={
            title: null,
            type: '',
            message: null,
            sale:null
        }
    }

	isDataChange(prev_data, new_data){
		if(prev_data.title !== new_data.title)
			return true;
		if(prev_data.type !== new_data.type)
			return true;
		if(prev_data.message !== new_data.message)
			return true;
        if(prev_data.sale !== new_data.sale)
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
        let sale = data.sale!==undefined?data.sale:this.state.sale;
		this.setState({
			title: title,
			type: type,
			message: message,
            sale:sale,
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

    handleCancelForce = () => {
		if(this.props.handleCancelForce)
			this.props.handleCancelForce(this.state.sale);
		else
			this.setState({
				message: null,
			});
	}

    handleRefundForce = () => {
		if(this.props.handleRefundForce)
			this.props.handleRefundForce(this.state.sale);
		else
			this.setState({
				message: null,
			});
	}

	render(){
		const { title, message, type } = this.state;
		return(
			<Modal
				isOpen={message?true:false}
				backdrop="static"
				keyboard={false}>
				<ModalHeader className="text-center">Sistema de Operaciones y VP{title?": "+title:""}</ModalHeader>
				<ModalBody className="text-center">
					<h3><i className="bi bi-exclamation-triangle-fill"></i></h3>
					<h6>{message}</h6>
				</ModalBody>
				<ModalFooter>
                    <ButtonGroup className="my-2" size="sm">
                    <Button color="primary" onClick={this.handleClose}>
                        Cerrar
                    </Button>
					{type==="cancel"?
						<Button color="warning" onClick={()=>this.handleCancelForce()}>
							Cancelar sin OPERA
						</Button>
					:<></>}
					{type==="refund"?
                        <Button color="warning" onClick={()=>this.handleRefundForce()}>
                            Reembolso sin OPERA
                        </Button>
                    :<></>}
                    </ButtonGroup>
				</ModalFooter>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalCancelationRefundForce {...props} history={history} />;
}