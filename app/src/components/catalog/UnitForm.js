import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class UnitForm extends Component{
    constructor(props){
        super(props);
        this.getOptionValue = this.getOptionValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                code: "",
                name: "",
                capacity: 0,
                is_private: 0,
                provider: null,
                unit_type:null
            },
            options_providers: [],
            options_unit_types: [],
            modal:{
                title: "Proveedor",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'property',
                isopen:false,
                filter:"OP",
                value:null
            },
        }
        
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.target.name]:event.target.value,
				},
			};
		});
    }

    onChangeSelectValue(data, event) {
        let value = data?data.value:data;
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.name]:value,
				},
			};
		});
    }

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    is_private:event.target.checked,
				},
			};
		});
    }

    onSubmit(e){
        e.preventDefault();
        if(this.state.id===null || this.state.data.property===null){
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
                        property:value
                    }
                };
            },
            () => this.SaveModelForm()
        );
	}

    SaveModelForm(){
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}general/units/${this.state.id}/`, this.state.data)
                .then(res => {
                    this.reset(res.data.id);
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
            axios.post(`${ApiUrl}general/units/`, this.state.data)
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
                    this.props.history('/catalogs/unit/'+res.data.id)
                });
        }
    }

    componentDidMount() {
        let id = this.props.params.id?this.props.params.id:null;
		this.reset(id);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.params.id !== this.props.params.id) {
			this.reset(this.props.params.id?this.props.params.id:null);
		}
	}

    reset(id){
        if (id !== null){
            axios.get(`${ApiUrl}general/units/${id}/`).then(res => {
                this.setState(
                    (prev_State) =>{
                    return {
                        id:id,
                        data:res.data,
                        modal_properties: {
                            ...prev_State.modal_properties,
                            value:res.data.property,
                        },
                    };
                });
                this.options_load();
            });
        } else {
            this.setState({
                id:null,
                data:{
                    code: "",
                    name: "",
                    capacity: 0,
                    is_private: 0,
                    provider: null,
                    unit_type:null
                },
                modal_properties:{
                    type:'property',
                    isopen:false,
                    filter:"OP",
                    value:null
                },
            });
            this.options_load();
        }
    }

    options_load(){
        axios.get(`${ApiUrl}general/providers/`).then(res => {
            this.setState({
                options_providers:res.data.results.map((provider)=>{return {value:provider.id,label:provider.name}})
            });
        });

        axios.get(`${ApiUrl}general/unit_types/`).then(res => {
            this.setState({
                options_unit_types:res.data.results.map((unit_type)=>{return {value:unit_type.id,label:unit_type.name}})
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
        this.props.history('/catalogs/units');
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
        this.props.history('/catalogs/unit/')
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

    getOptionValue = (field) =>{
        let options = new Array(), 
            value = null;
        switch(field){
            case "provider":
                options = this.state.options_providers;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
            case "unit_type":
                options = this.state.options_unit_types;
                value = options.find((option)=>option.value===this.state.data[field]);
                break;
        }
        return value;
    }

    render(){
        const { id,data,modal,modal_properties,options_providers,options_unit_types } = this.state;
        const select_option_provider = this.getOptionValue("provider");
        const select_option_unit_type = this.getOptionValue("unit_type");
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={2}>
                            <FormGroup>
                                <Label>Clave</Label>
                                <Input type="text" 
                                    name="code"
                                    size={10}
                                    maxLength={10}
                                    placeholder="Clave" 
                                    value={data.code}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Nombre</Label>
                                <Input type="text" 
                                    name="name"
                                    placeholder="Nombre" 
                                    value={data.name}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={5}>
                            <FormGroup>
                                <Label>Tipo de unidad</Label>
                                <Select
                                    options={options_unit_types}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder="Tipo de unidad" 
                                    name="unit_type"
                                    value={select_option_unit_type}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={2}>
                            <FormGroup>
                                <Label>Capacidad</Label>
                                <Input type="number"
                                    size={10}
                                    maxLength={10}
                                    name="capacity"  
                                    placeholder="Capacidad" 
                                    value={data.capacity}
                                    onChange={this.onChangeValue}/>
                            </FormGroup>
                        </Col>
                        <Col sm={5}>
                            <FormGroup>
                                <Label>Proveedor</Label>
                                <Select
                                    options={options_providers}
                                    isClearable={true}
                                    isSearchable={true}
                                    placeholder={"Seleccione proveedor"}
                                    name="provider"
                                    value={select_option_provider}
                                    onChange={this.onChangeSelectValue}/>
                            </FormGroup>
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="is_private"
                                    checked={data.is_private}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>¿Es privado?</Label>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal} />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <UnitForm {...props} params = {params} history={history} />;
}