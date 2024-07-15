import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class StoreForm extends Component{
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                code: 0,
                name: '',
            },
            modal:{
                title: "Tiendas",
                type: 'success',
                message: null,
            },
            modal_properties:{
                type:'properties',
                isopenonproperties:true,
                isopen:false,
                value:[]
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
        this.setState(function (prev_State) {
            return {
                modal_properties: {
                    ...prev_State.modal_properties,
                    isopen: true,
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
                        properties:value
                    }
                };
            },
            () => this.SaveModelForm()
        );
	}

    SaveModelForm(){
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}general/stores/${this.state.id}/`, this.state.data)
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
            axios.post(`${ApiUrl}general/stores/`, this.state.data)
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
					this.props.history('/catalogs/stores/'+res.data.id);
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
            axios.get(`${ApiUrl}general/stores/${id}/`)
                .then(res => {
                    this.setState(function (prev_State) {
                        return {
                            id:id,
                            data:res.data,
                            modal_properties: {
                                ...prev_State.modal_properties,
                                value:res.data.properties,
                                value:res.data.properties,
                            },
                        };
                    });
                });
        } else {
            this.setState({
                id:null,
                data:{
                    code: 0,
                    name: "",
                },
                modal_properties:{
                    type:'properties',
                    isopen:false,
                    value:[]
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
        this.props.history('/catalogs/stores');
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
        this.props.history('/catalogs/stores/')
	}

    render(){
        const { data,modal,modal_properties } = this.state;
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                <Row>
                    <Col sm={6}>
                        <FormGroup>
                            <Label>Código</Label>
                            <Input type="number" 
                                name="code"
                                maxLength={10}
                                placeholder="Código" 
                                value={data.code}
                                onChange={this.onChangeValue}
                                required/>
                        </FormGroup>
                    </Col>
                    <Col sm={6}>
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
                </Row>
                <FormGroup>
                    <Button variant="primary" type="submit">
                        Guardar
                    </Button>
                </FormGroup>
               </Form>
               <ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />
               <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <StoreForm {...props} params = {params} history={history} />;
}