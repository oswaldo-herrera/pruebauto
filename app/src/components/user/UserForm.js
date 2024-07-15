import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { UserExtension, User, createUserExtension, updateUserExtension, getUserExtension } from './UserModel';
import { ApiGeneralUrl, ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalChangePassword from '../ModalChangePassword';
import { getAllGroupPermissions } from './GroupPermissionModel';
import TabComponent from '../TabComponent';
import RequestList from './RequestList';
class UserForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onClickChangePassword = this.onClickChangePassword.bind(this);
        this.onClickSendWelcomeEmail = this.onClickSendWelcomeEmail.bind(this);
        this.handleChangePassword = this.handleChangePassword.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeExtensionValue = this.onChangeExtensionValue.bind(this);
        this.onChangeSwitchExtensionValue = this.onChangeSwitchExtensionValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onChangeSelectMultiValue = this.onChangeSelectMultiValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            user_extension: new UserExtension({
                id:null,
                user: new User(null,"","","","","",false,false),
                representative:null,
                provider:null,
                permission_group:null,
                properties:[],
            }),
            options: [],
            representatives: [],
            options_representatives: [],
            options_providers: [],
            options_groups: [],
            modal:{
                title: "Usuario",
                type: 'success',
                message: null,
            },
            tabs:[]
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

    onChangeExtensionValue(event) {
		this.setState(function (prevState) {
			return {
				user_extension: {
					...prevState.user_extension,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
                user_extension: {
					...prevState.user_extension,
                    user: {
                        ...prevState.user_extension.user,
                        [event.target.name]:event.target.checked,
                    },
				},
			};
		});
    }

    onChangeSwitchExtensionValue(event) {
		this.setState(function (prevState) {
			return {
                user_extension: {
					...prevState.user_extension,
                    [event.target.name]:event.target.checked,
				},
			};
		});
    }

    onChangeSelectMultiValue(data) {
        let value = data?data.map((option)=>option.value):[];
		this.setState(function (prevState) {
			return {
                user_extension: {
                    ...prevState.user_extension,
                    properties:value,
                },
		    };
		},()=>this.options_representatives_load());
    }

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
		this.setState(function (prevState) {
			return {
                user_extension: {
                    ...prevState.user_extension,
                    [event.name]:value,
                },
		    };
		});
    }

    onSubmit(e){
        e.preventDefault();
        const obj = {
            name: this.state.name,
        };
        if (this.state.id !== null) {
            updateUserExtension(this.state.id, this.state.user_extension)
                .then(res => {
                    this.reset(res.id);
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
        } else {
            createUserExtension(this.state.user_extension)
                .then(res => {
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Guardado exitoso!",
                            },
                        };
                    });
                    this.props.history('/user_extension/'+res.id)
                }).catch(error => {
                    window.alert(error.response.data.username)
                });
        }
    }

    componentDidMount() {
        let id = this.props.params.id?this.props.params.id:null;
		this.reset(id);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.params.id !== this.props.params.id) {
			this.reset(this.props.params.id);
		}
        console.log(this.state.user_extension);
	}

    reset(id){
        axios.get(`${ApiUrl}general/properties/`).then(options_result => {
            let options = options_result.data.results.map((property)=>{
                return {
                    value:property.id,
                    label:property.name
                }
            });
            if (id !== null){
                getUserExtension(id)
                    .then(res => {
                        this.setState(function (prev_State) {
                            return {
                                id:id,
                                user_extension:new UserExtension(res),
                                options:options,
                                change_password:{
                                    ...prev_State.change_password,
                                    id:id,
                                },
                                tabs:this.tabsComponent(res.user.id)
                            }
                        },()=>this.options_load());
                    });
            } else {
                this.setState(function (prev_State) {
                    return {
                        id:null,
                        user_extension: new UserExtension({
                            id:null,
                            user: new User(null,"","","","","",false,false),
                            permission_group:null,
                            representative:null,
                            provider:null,
                            properties:[],
                            verification_2fa: false,
                            verification_2fa_method: "email",
                            phone:""
                        }),
                        options:options,
                        change_password:{
                            ...prev_State.change_password,
                            id:null,
                        }
                    }
                },()=>this.options_load());
            }
        });
    }

    tabsComponent(user){
        return [
            {
                key:0,
                title: "Consultas al api",
                component: <RequestList user={user} />,
            }
        ]
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
        this.props.history('/user_admin');
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
        this.props.history('/user_admin');
	}

    handleCloseAddMore = () => {
		this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
                id:null,
                change_password:{
                    ...prev_State.change_password,
                    id:null,
                }
            };
        });
        this.props.history('/user_extension/')
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

    options_load(){
        axios.get(`${ApiUrl}general/representatives/?limit=500&active=true`)
        .then(res => {
            this.setState({
                representatives:res.data.results
            },()=>this.options_representatives_load());
        });
        getAllGroupPermissions().then((result) =>{
            this.setState({
                options_groups:result.map((group)=>{return {value:group.id,label:group.name}})
            });
        });
        axios.get(`${ApiUrl}general/providers/?limit=500`)
        .then(res => {
            this.setState({
                options_providers:res.data.results.map((provider)=>{return {value:provider.id,label:provider.name}})
            });
        });
        getAllGroupPermissions().then((result) =>{
            this.setState({
                options_groups:result.map((group)=>{return {value:group.id,label:group.name}})
            });
        });
    }

    options_representatives_load(){
        var representatives = this.state.representatives;
        if(this.state.user_extension.properties.length > 0)
            representatives = this.state.representatives.filter((representative)=>this.state.user_extension.properties.find((property)=>representative.property===property)!==undefined)
        this.setState({
            options_representatives:representatives.map((representative)=>{return {value:representative.id,label:representative.name}})
        });
    }

    getOptionValue(){
        let value = this.state.options.filter((option)=>this.state.user_extension.properties.includes(option.value));
        return value;
    }

    getOptionValueField = (field) =>{
        let options = new Array(), 
            value = null,
            data = null;
        switch(field){
            case "representative":
                options = this.state.options_representatives;
                data = this.state.user_extension[field];
                if (data != null)
                    value = options.find((option)=>option.value===this.state.user_extension[field]);
                else
                    value = undefined
                break;
            case "provider":
                options = this.state.options_providers;
                value = options.find((option)=>option.value===this.state.user_extension[field]);
                break;
            case "permission_group":
                options = this.state.options_groups;
                data = this.state.user_extension[field];
                if (data != null)
                    value = options.find((option)=>option.value===this.state.user_extension[field]);
                else
                    value = undefined
        }
        return value;
    }

    onClickChangePassword = () => {
        axios.post(`${ApiGeneralUrl}user_send_reset_password_email/${this.state.id}/`)
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

    onClickSendWelcomeEmail = () => {
        axios.post(`${ApiGeneralUrl}user_send_welcome_email/${this.state.id}/`)
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
        const { id,user_extension,options, options_representatives, options_providers, options_groups, modal, change_password, tabs } = this.state;
        const select_options = this.getOptionValue();
        const select_option_representative = this.getOptionValueField('representative');
        const select_option_group = this.getOptionValueField('permission_group');
        const select_option_provider = this.getOptionValueField("provider");
        return(<>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col xs="3">
                            <FormGroup>
                                <Label for="username">Nombre de usuario</Label>
                                <Input type="text" 
                                    name="username"
                                    value={user_extension.user.username}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
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
                        <Col xs="3">
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="is_superuser"
                                    checked={user_extension.user.is_superuser}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>¿Es administrador?</Label>
                            </FormGroup>
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="is_active"
                                    checked={user_extension.user.is_active}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>¿Esta activo?</Label>
                            </FormGroup>
                        </Col>
                        <Col xs="4">
                            <FormGroup>
                                <Label for="email">Correo</Label>
                                <Input type="email" 
                                    name="email"
                                    value={user_extension.user.email}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={4}>
                            <FormGroup switch className='mb-2'>
                                <Input type="switch" 
                                    name="verification_2fa"
                                    checked={user_extension.verification_2fa}
                                    onChange={this.onChangeSwitchExtensionValue}/>
                                <Label check>Verificacion por 2FA</Label>
                            </FormGroup>
                            {user_extension.verification_2fa?
                            <FormGroup>
                                <Input type="select" 
                                    name="verification_2fa_method"  
                                    placeholder="Metodo de verificación" 
                                    value={user_extension.verification_2fa_method}
                                    onChange={this.onChangeExtensionValue}
                                    disabled
                                    required>
                                        <option value={'EMAIL'}>Correo</option>
                                        <option value={'SMS'}>SMS</option>
                                </Input>
                            </FormGroup>:<></>}
                        </Col>
                        <Col xs="4">
                            <FormGroup>
                                <Label for="representative">Representante</Label>
                                <Select
                                    options={options_representatives}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder={"Representante"}
                                    name="representative"
                                    value={select_option_representative}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col xs="4">
                            <FormGroup>
                                <Label for="provider">Proveedor</Label>
                                <Select
                                    options={options_providers}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder={"Proveedor"}
                                    name="provider"
                                    value={select_option_provider}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col xs="4">
                            <FormGroup>
                                <Label for="permission_group">Grupo de permiso</Label>
                                <Select
                                    options={options_groups}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder={"Grupo de permisos"}
                                    name="permission_group"
                                    value={select_option_group}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col xs="6">
                            <FormGroup>
                                <Label for="properties">Propiedades</Label>
                                <Select
                                    isMulti
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    options={options}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder={"Propiedades"}
                                    name="properties"
                                    value={select_options}
                                    onChange={this.onChangeSelectMultiValue}/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <ButtonGroup>
                            <Button color="primary" type="submit">
                                <i className="bi bi-save"></i> Guardar
                            </Button>
                            <Button color="success" disabled={id?false:true} onClick={this.onClickSendWelcomeEmail}>
                                <i className="bi bi-email"></i> Enviar Correo de Bienvenida
                            </Button>
                            <Button color="info" disabled={id?false:true} onClick={this.onClickChangePassword}>
                                <i className="bi bi-lock"></i> Cambiar contraseña
                            </Button>
                        </ButtonGroup>
                    </FormGroup>
               </Form>
               {id?<TabComponent currentTab={"0"} tabs={tabs} className="border-top pt-3"/>
                :<></>}
               <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />

        </>)
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <UserForm {...props} params = {params} history={history} />;
}