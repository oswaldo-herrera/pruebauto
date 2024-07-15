import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiSalesUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class CoordinatorsComissionForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                date: "",
                comission: 0.0,
            },
            modal:{
                title: "Comisión de coordinadores pagos directos",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'property',
                isopen:false,
                filter:"VP",
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

    SaveModelForm(){;
        if (this.state.id !== null) {
            axios.put(`${ApiSalesUrl}coordinators_comissions/${this.state.id}/`, this.state.data)
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
                }).catch(this.catchDateError);
        } else {
            axios.post(`${ApiSalesUrl}coordinators_comissions/`, this.state.data)
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
                    if(this.state.provider === null)
                        this.props.history('/catalogs/coordinatorscomission/'+res.data.id)
                }).catch(this.catchDateError);
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

    catchDateError = (error) =>{
        if(error.response.status == 500){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: "Error interno de servidor: contacte al administrador del sistema para continuar",
                    },
                };
            });
        } else if(error.response.data.hasOwnProperty('date') > -1){
            this.setState(function (prev_State) {
                return {
                    modal: {
                        ...prev_State.modal,
                        type:"error",
                        message: error.response.data.date,
                    },
                };
            });
        }
    }

    componentDidMount() {
        let id = this.props.params.id?this.props.params.id:null;
        this.reset(id)
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.params.id !== this.props.params.id) {
			this.reset(this.props.params.id?this.props.params.id:null);
		}
	}

    reset(id){
        if (id !== null){
            axios.get(`${ApiSalesUrl}coordinators_comissions/${id}/`)
                .then(res => {
                    this.setState(function (prev_State) {
                        return {
                            id:id,
                            data:res.data,
                            modal_properties: {
                                ...prev_State.modal_properties,
                                value:res.data.property,
                            },
                        };
                    });
                });
        } else {
            this.setState({
                id:null,
                data:{
                    date: "",
                    comission: 0.0,
                },
                modal_properties:{
                    type:'property',
                    isopen:false,
                    filter:"VP",
                    value:null
                },
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
        this.props.history('/catalogs/coordinators_comission/');
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

    render(){
        const { data,modal,modal_properties } = this.state;
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Fecha de inicio</Label>
                                <Input type="date" 
                                    name="date"
                                    placeholder="Fecha de inicio" 
                                    value={data.date}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <FormGroup>
                                <Label>Comisión</Label>
                                <Input type="number" 
                                    name="comission"  
                                    placeholder="Comisión" 
                                    value={data.comission}
                                    onChange={this.onChangeValue}
                                    required/>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} handleCloseError={this.handleCloseError}  data={modal}  />
                <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <CoordinatorsComissionForm {...props} params = {params} history={history} />;
}