import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { UserExtension, User, updateProfile, getProfile } from './UserModel';
import { ApiGeneralUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalChangePassword from '../ModalChangePassword';
class ProfileForm extends Component{
    constructor(props){
        super(props);
        this.onClickChangePassword = this.onClickChangePassword.bind(this);
        this.handleChangePassword = this.handleChangePassword.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            user_extension: new UserExtension({
                id:null,
                user: new User(null,"","","","","",false,false),
                properties:[],
            }),
            modal:{
                title: "Perfil",
                type: 'success',
                message: null,
            },
            change_password:{
                title: "Perfil",
                id: "profile",
                open: false,
            }
        }
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				user_extension: {
					...prevState.user_extension,
                    user: {
                        ...prevState.user_extension.user,
                        [event.target.name]:event.target.value,
                    },
				},
			};
		});
    }

    onSubmit(e){
        e.preventDefault();
        updateProfile(this.state.user_extension)
        .then(res => {
            this.reset();
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"success",
                        message: "¡Actualización exitosa!",
                    },
                };
            });
        }).catch(error => {
            window.alert(error.response.data.username)
        });
    }

    componentDidMount() {
		this.reset();
	}

	componentDidUpdate(prevProps, prevState) {
        console.log(this.state.user_extension);
	}

    reset(){
        getProfile().then(res => {
            this.setState(function (prev_State) {
                return {
                    user_extension:new UserExtension(res),
                }
            });
        });
    }

    handleClose = () => {
        this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
            };
        });
	}

    handleClosePassword = () => {
        this.setState(function (prev_State) {
            return {
                change_password:{
                    ...prev_State.change_password,
                    open:false,
                }
            };
        });
	}
    
    handleChangePassword = () => {
        this.setState(function (prev_State) {
            return {
                change_password:{
                    ...prev_State.change_password,
                    open:false,
                }
            };
        });
	}

    handleCloseError = () => {
		this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
            };
        });
	}

    onClickChangePassword = () => {
        axios.post(`${ApiGeneralUrl}profile_send_reset_password_email/`)
        .then(res => {
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"success",
                        message: res.data.message,
                    },
                };
            });
        })
    }

    render(){
        const { user_extension, modal, change_password } = this.state;
        return(<>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col xs="3">
                            <FormGroup>
                                <Label for="first_name">Nombre</Label>
                                <Input type="text" 
                                    name="first_name"
                                    value={user_extension.user.first_name}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col xs="3">
                            <FormGroup>
                                <Label for="last_name">Apellido</Label>
                                <Input type="text" 
                                    name="last_name"
                                    value={user_extension.user.last_name}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col xs="6">
                            <FormGroup>
                                <Label for="email">Correo</Label>
                                <Input type="email" 
                                    name="email"
                                    value={user_extension.user.email}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <ButtonGroup>
                            <Button color="primary" type="submit">
                                <i className="bi bi-save"></i> Guardar
                            </Button>
                            <Button color="info" disabled={user_extension.id?false:true} onClick={this.onClickChangePassword}>
                                <i className="bi bi-lock"></i> Solicitar cambio de contraseña
                            </Button>
                        </ButtonGroup>
                    </FormGroup>
               </Form>
               <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
               <ModalChangePassword handleClose={this.handleClosePassword} handleChangePassword={this.handleChangePassword} data={change_password} />

        </>)
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <ProfileForm {...props} params = {params} history={history} />;
}