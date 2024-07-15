import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Col, Row, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import {FormGroup, Label, Form, Input } from 'reactstrap';
import Select from 'react-select';
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import ModalAlert from '../ModalAlert';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class PaymentTypeForm extends Component{
    constructor(props){
        super(props);
        this.onChangeSwitchValue = this.onChangeSwitchValue.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            id: null,
            data:{
                name: "",
                is_commissionable: true
            },
            options: [],
            modal:{
                title: "Tipo de forma de pago",
                type: 'success',
                message: null,
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

    onChangeSwitchValue(event) {
		this.setState(function (prevState) {
			return {
				data: {
					...prevState.data,
                    [event.target.name]:event.target.checked,
				},
			};
		});
    }

    onSubmit(e){
        e.preventDefault();
        if (this.state.id !== null) {
            axios.put(`${ApiUrl}sales/payment_types/${this.state.id}/`, this.state.data)
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
            axios.post(`${ApiUrl}sales/payment_types/`, this.state.data)
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
                    this.props.history('/catalogs/payment_type/'+res.data.id)
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
            axios.get(`${ApiUrl}sales/payment_types/${id}/`)
            .then(res => {
                this.setState(
                    (prev_State) =>{
                    return {
                        id:id,
                        data:res.data,
                    }
                });
            }); 
        } else {
            this.setState({
                id:null,
                data:{
                    name: "",
                    is_commissionable: true,
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
        this.props.history('/catalogs/payment_types');
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
        this.props.history('/catalogs/payment_type/')
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
        const { id,data,modal,modal_properties,options } = this.state;
        return(
            <div>
                <Form onSubmit={this.onSubmit}>
                    <Row>
                        <Col sm={4}>
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
                        <Col sm={3}>
                            <FormGroup switch className="mb-2">
                                <Input type="switch" 
                                    name="is_commissionable"
                                    checked={data.is_commissionable}
                                    onChange={this.onChangeSwitchValue}/>
                                <Label check>Es comisionable</Label>
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Button variant="primary" type="submit">
                            Guardar
                        </Button>
                    </FormGroup>
                </Form>
                {/*<ModalPropertiesAsignment handleClose={this.handlePropertyClose} handleAsignment={this.handleAsignment} data={modal_properties}  />*/}
                <ModalAlert handleClose={this.handleClose} handleCloseAddMore={this.handleCloseAddMore} data={modal}  />
            </div>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    const params = useParams(); 
    return <PaymentTypeForm {...props} params = {params} history={history} />;
}