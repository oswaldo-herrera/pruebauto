import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { FormGroup, Label, Form, Input, FormFeedback } from 'reactstrap';
import { newPasswordUserExtension, newPasswordProfile } from './user/UserModel';
class ModalChangePassword extends Component{
	
    constructor(props){
        super(props);
		this.handleClose = this.handleClose.bind(this);
		this.onChangeValue = this.onChangeValue.bind(this);
		this.state={
            title: null,
            id:null,
            password: '',
            password_repet: '',
            open: false,
            error:""
        }
    }

    onChangeValue(event) {
		this.setState({
			[event.target.name]:event.target.value,
		});
    }

    onSubmit = () => {
        if (this.state.id !== null && this.state.id !== "profile") {
            newPasswordUserExtension(this.state.id, 
            {
                password:this.state.password,
                password_repet:this.state.password_repet
            }).then(res => {
                this.setState({
                    open:false,
                });
                if(this.props.handleChangePassword)
			        this.props.handleChangePassword();
            }).catch(error => {
                this.setState({
                    error:error.response.data.password,
                });
            });
        } else if (this.state.id !== null){
            newPasswordProfile( 
            {
                password:this.state.password,
                password_repet:this.state.password_repet
            }).then(res => {
                this.setState({
                    open:false,
                });
                if(this.props.handleChangePassword)
			        this.props.handleChangePassword();
            }).catch(error => {
                this.setState({
                    error:error.response.data.password,
                });
            });
        }
    }

	isDataChange(prev_data, new_data){
		if(prev_data.title !== new_data.title)
			return true;
        if(prev_data.id !== new_data.id)
			return true;
		if(prev_data.open !== new_data.open)
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
        let id = data.id!==undefined?data.id:this.state.id;
		let open = data.open!==undefined?data.open:this.state.open;
		this.setState({
			title: title,
            id:id,
			open: open,
            password:'',
            password_repet:''
		});
	}

	handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
		else
			this.setState({
				open: false,
			});
	}

	render(){
		const { title, open, id, password, password_repet, error } = this.state;
		return(
			<Modal
				isOpen={open}
				backdrop="static"
				keyboard={false}
                toggle={this.handleClose}>
				<ModalHeader className="text-center" toggle={this.handleClose}>Sistema de Operaciones y VP{title?": "+title:""}</ModalHeader>
				<ModalBody>
					<Form>
                        <Row>
                            <Col sm={12}>
                                <FormGroup>
                                    <Label for="password">Contraseña</Label>
                                    <Input type="password" 
                                        name="password"
                                        value={password}
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={12}>
                                <FormGroup>
                                    <Label for="password_repet">Repetir contraseña</Label>
                                    <Input type="password" 
                                        name="password_repet"
                                        value={password_repet}
                                        onChange={this.onChangeValue}
                                        invalid={error!==""}/>
                                    {error!==""?
                                    <FormFeedback tooltip>
                                        {error}
                                    </FormFeedback>:<></>}
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
				</ModalBody>
				<ModalFooter>
					<Button color="primary" onClick={this.onSubmit} disabled={id === null}>
						Aceptar
					</Button>
				</ModalFooter>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalChangePassword {...props} history={history} />;
}