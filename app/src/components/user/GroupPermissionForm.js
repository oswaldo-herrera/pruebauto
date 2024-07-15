import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { GroupPermission, Permission, createGroupPermission, updateGroupPermission, getGroupPermission } from './GroupPermissionModel';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalChangePassword from '../ModalChangePassword';
import DualListBox from 'react-dual-listbox';
import 'react-dual-listbox/lib/react-dual-listbox.css';
import 'react-dual-listbox/src/scss/react-dual-listbox.scss';
class GroupPermissionForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            group_permission: new GroupPermission({
                id:null,
                name:"",
                permissions:[],
            }),
            options_permissions: [],
            modal:{
                title: "Grupo de permisos",
                type: 'success',
                message: null,
            },
        }
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				group_permission: {
					...prevState.group_permission,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    onChangeSelectValue(values) {     
		this.setState(function (prevState) {
			return {
                group_permission: {
                    ...prevState.group_permission,
                    permissions:values,
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
            updateGroupPermission(this.state.id, this.state.group_permission)
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
            createGroupPermission(this.state.group_permission)
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
                    this.props.history('/permission_group/'+res.id)
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
	}

    reset(id){
        axios.get(`${ApiUrl}general/permissions/`).then(options_result => {
            let options = options_result.data.map((permission)=>{
                return {
                    value:permission.id,
                    label:permission.name
                }
            });
            if (id !== null){
                getGroupPermission(id)
                    .then(res => {
                        this.setState(function (prev_State) {
                            return {
                                id:id,
                                group_permission:new GroupPermission(res),
                                options_permissions:options,
                            }
                        });
                    });
            } else {
                this.setState(function (prev_State) {
                    return {
                        id:null,
                        group_permission: new GroupPermission({
                            id:null,
                            name:"",
                            permissions:[],
                        }),
                        options_permissions:options,
                    }
                });
            }
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
        this.props.history('/permission_groups');
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
        this.props.history('/permission_group/')
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

    getOptionValue(){
        let value = this.state.options_permissions.filter((option)=>this.state.group_permission.permissions.includes(option.value));
        return value;
    }

    render(){
        const { id,group_permission, options_permissions, modal } = this.state;
        const select_options = this.getOptionValue();
        return(<>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col xs="4">
                            <FormGroup>
                                <Label for="name">Nombre</Label>
                                <Input type="text" 
                                    name="name"
                                    value={group_permission.name}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col xs="12">
                            <FormGroup>
                                <Label for="permissions">Permisos</Label>
                                <DualListBox
                                    required
                                    canFilter
                                    options={options_permissions}
                                    onChange={this.onChangeSelectValue}
                                    selected={group_permission.permissions}/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <ButtonGroup>
                            <Button color="primary" type="submit">
                                <i className="bi bi-save"></i> Guardar
                            </Button>
                        </ButtonGroup>
                    </FormGroup>
               </Form>
               <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />

        </>)
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <GroupPermissionForm {...props} params = {params} history={history} />;
}