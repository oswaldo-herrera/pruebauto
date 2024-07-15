import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class SimpleForm extends Component{
    constructor(props){
        super(props);
        this.onChangeName = this.onChangeName.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                name: '',
            },
            modal:{
                title: "",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:null,
                filter: null,
                isopen:false,
                value:null
            },
            model:null,
        }
    }

    onChangeName(e) {
        this.setState(function (prev_State) {
            return {
                data: {
                    ...prev_State.data,
                    name: e.target.value
                },
            };
        });
    }

    onSubmit(e){
        e.preventDefault();
        if(this.state.modal_properties.type==="property"){
            this.setState(function (prev_State) {
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: true,
                    },
                };
            });
        } else if(this.state.modal_properties.type==="properties"){
            this.setState(function (prev_State) {
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: true,
                    },
                };
            });
        } else {
            this.SaveModelForm()
            
        }
    }

    SaveModelForm(){
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}${this.state.model.url}/${this.state.id}/`, this.state.data)
                .then(res => {
                    this.setState(function (prev_State) {
                        return {
                            modal: {
                                ...prev_State.modal,
                                type:"success",
                                message: "¡Actualización exitosa!",
                            },
                        };
                    });
                });
        } else {
            axios.post(`${ApiUrl}${this.state.model.url}/`, this.state.data)
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
                    this.props.history('/catalogs/'+this.state.model.name+'/'+res.data.id)
                });
        }
    }

    componentDidMount() {
        let id = this.props.params.id?this.props.params.id:null;
        let model = this.props.model?this.props.model:this.state.model;
        let type = this.props.type?this.props.type:this.state.type;
        let filter = this.props.filter?this.props.filter:this.state.modal_properties.filter;
		this.reset(id,model,type,filter);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.params.id !== this.props.params.id || prevProps.model !== this.props.model) {
            let id = this.props.params.id?this.props.params.id:null;
            let model = this.props.model?this.props.model:this.state.model;
            let type = this.props.type?this.props.type:this.state.type;
            let filter = this.props.filter?this.props.filter:this.state.modal_properties.filter;
			this.reset(id,model,type,filter);
		}
	}

    reset(id,model,type,filter){
        if (id !== null){
            axios.get(`${ApiUrl}${model.url}/${id}/`)
                .then(res => {
                    this.setState(function (prev_State) {
                        return {
                            id:id,
                            data:res.data,
                            model:model,
                            modal_properties: {
                                ...prev_State.modal_properties,
                                type:type,
                                filter:filter,
                                value:res.data[type],
                                isopenonproperties:true,
                                properties_data:type=="properties"?res.data.properties_data:[],
                            },
                        };
                    });
                });
        } else {
            this.setState(function (prev_State) {
                return {
                    id:null,
                    data:{
                        name: '',
                    },
                    model:model,
                    modal_properties: {
                        ...prev_State.modal_properties,
                        type:type,
                        filter:filter,
                        value:type=="property"?null:[],
                        isopenonproperties:true,
                        properties_data:[],
                    },
                };
            });
        }
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
        this.props.history('/catalogs/'+this.state.model.react_url);
	}

    handleCloseAddMore = () => {
		this.setState(function (prev_State) {
            return {
                modal: {
                    ...prev_State.modal,
                    message: null,
                },
                id:null
            };
        });
        this.props.history('/catalogs/'+this.state.model.name+'/')
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

    handlePropertyClose = () => {
        this.setState(function (prev_State) {
            return {
                modal_properties: {
                    ...prev_State.modal_properties,
                    isopen: false,
                },
            };
        });
	}

    handleAsignment = (value) => {
        this.setState(
            (prev_State) =>{
                return {
                    modal_properties: {
                        ...prev_State.modal_properties,
                        isopen: false,
                    },
                    data:{
                        ...prev_State.data,
                        [this.state.modal_properties.type]:value
                    }
                };
            },
            () => this.SaveModelForm()
        );
	}

    render(){
        const { id,data,modal, modal_properties } = this.state;
        return(
            <div>
               <Row>
                <Col sm={6}>
                    <Form onSubmit={this.onSubmit}>
                        <FormGroup>
                            <Label>Nombre</Label>
                            <Input type="text" 
                                name="Name"  
                                placeholder="Nombre" 
                                value={data.name}
                                onChange={this.onChangeName}
                                required/>
                        </FormGroup>
                        <FormGroup>
                            <Button variant="primary" type="submit">
                                Guardar
                            </Button>
                        </FormGroup>
                    </Form>
                </Col>
               </Row>
               <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
               <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <SimpleForm {...props} params = {params} history={history} />;
}