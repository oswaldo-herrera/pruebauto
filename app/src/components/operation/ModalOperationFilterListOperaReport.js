import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, UncontrolledAccordion, AccordionItem, AccordionHeader, AccordionBody } from "reactstrap";
import { ReservationService } from './ReservationModel';
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
import ModalPropertiesAsignment from '../ModalPropertiesAsignment';
class ModalOperationFilterListOperaReport extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeValueRadioHotel = this.onChangeValueRadioHotel.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            params:{
                opera_code:"",
                brand:"HARDROCK",
            },
            property:null,
            requestActive:false,
        }
    }

    onChangeValue(event) {
		this.setState(function (prevState) {
			return {
				params: {
					...prevState.params,
                    [event.target.name]:event.target.value,
				},
			};
		},()=>{
            this.reset(this.state);
        }); 
    }

    onChangeValueRadioHotel(event) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    domain:event.target.value,
                },
            };
        },()=>{
            this.reset(this.state);
        });
    }

    isDataChange(prev_data, new_data){
		if(prev_data.params !== new_data.params)
			return true;
        if(prev_data.open !== new_data.open)
			return true;
        if(prev_data.property !== new_data.property)
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
        let open = data.open!==undefined?data.open:this.state.open;
        let property = data.property!==undefined?data.property:this.state.property;
        this.setState(
            (prev_State) =>{
                return {
                    ...prev_State,
                    open: open,
                    property: property,
                };
            }
        );
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

	onSubmit(e){
        e.preventDefault();
        this.setState({
			requestActive: true,
		});
        axios.get(`${ApiOperationsUrl}operation_opera_importation/?opera_code=${this.state.params.opera_code}&brand=${this.state.params.brand}&property=${this.state.property}`)
        .then(res => {
            if(this.props.handleSave&&res.data.success)
			    this.props.handleSave(res.data.reservation);
        }).catch(this.catchDateError).finally(()=>this.setState({
            requestActive: false,
        }));
	}

    catchDateError = (error) =>{
        if(error.response.status == 403){
            alert("No tiene permisos para realizar esta accion.");
        } else {
            alert(error.response.data.error);
        }
    }
    
	render(){
		const { params, open, requestActive } = this.state;
		return(<>
			<Modal
				isOpen={open}
				backdrop="static"
                size='sm'
				keyboard={false}>
				<ModalHeader className="text-center">Importar de OPERA</ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="filter-opera-form">
                        <Row>
                            <Col sm={12}>
                                <FormGroup>
                                    <Label size='sm'>
                                        Reserva opera
                                    </Label>
                                    <Input type='text'
                                        name="opera_code"
                                        value={params.opera_code}
                                        required
                                        onChange={this.onChangeValue}/>
                                </FormGroup>
                            </Col>
                            <Col sm={12}>
                                <FormGroup>
                                    <Label>Propiedad (Marca) </Label>
                                    <Input type="select" 
                                        name="brand"  
                                        placeholder="Propiedad (Marca)" 
                                        value={params.brand}
                                        required
                                        onChange={this.onChangeValue}>
                                            <option value={'HARDROCK'}>Hard Rock</option>
                                            <option value={'UNICO'}>UNICO</option>
                                            <option value={'NOBU'}>NOBU</option>
                                            <option value={'AVA'}>AVA</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
				</ModalBody>
				<ModalFooter>
					<ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" type="submit" form='filter-opera-form' disabled={requestActive}>
							Aceptar
						</Button>
					</ButtonGroup>
				</ModalFooter>
			</Modal>
        </>)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalOperationFilterListOperaReport {...props} history={history} />;
}