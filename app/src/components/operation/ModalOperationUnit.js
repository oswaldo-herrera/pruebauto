import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, ListGroup, ListGroupItem, Table, InputGroup, List } from "reactstrap";
import { ReservationService } from './ReservationModel';
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl } from '../../constants/api/site';
class ModalOperationUnit extends Component{
	
    constructor(props){
        super(props);
        this.handleClose = this.handleClose.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.onChangeSelectValue = this.onChangeSelectValue.bind(this);
        this.handleAsignment = this.handleAsignment.bind(this);
        this.state={
            reservation_services:[],
            date:"",
            unit:null,
            unit_code:null,
            is_private:null,
            value:0,
            options_units:[],
            last_asigment_unit:0,
            property:null,
        }
    }

    onChangeValue(event) {
		this.setState({
			value:event.target.value,
		});
    }

    onChangeSelectValue(data, event) {
        let unit = data?data.value:data;
        let unit_code = data?data.label:data;
        let is_private = data?data.is_private:data;
        this.setState({
			unit:unit,
            unit_code:unit_code,
            is_private:is_private
		},()=>{
            this.load_unit_last_asignment();
        });
    }

	isDataChange(prev_data, new_data){
        if(prev_data.date !== new_data.date)
			return true;
        if(prev_data.unit !== new_data.unit)
			return true;
        if(prev_data.value !== new_data.value)
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
        if (data.reservation_services.length > 0)
            axios.get(`${ApiUrl}general/units/?limit=500`)
            .then(res => {
                this.setState({
                    options_units:res.data.results.map((unit)=>{return {value:unit.id,label:unit.code, private:unit.is_private}})
                });
            });
        this.setState({
            date:data.date,
            reservation_services:data.reservation_services,
            property:data.property
        },()=>{
            if(data.reservation_services.length > 0 && this.state.unit != null)
                this.load_unit_last_asignment()
        })
        
    }

    load_unit_last_asignment(){
        axios.get(`${ApiOperationsUrl}operations_unit_last_asigment/?date=${this.state.date}&property=${this.state.property}&unit=${this.state.unit}`)
        .then(res => {
            this.setState({
                last_asigment_unit:res.data.asigment
            });
        });
    }

    set_unit_last_asignment(){
        axios.put(`${ApiOperationsUrl}operations_unit_set_last_asigment/`,
            {
                unit: this.state.unit,
                asigment:this.state.value,
                reservation_services:this.state.reservation_services.map((rs)=>rs.id)
            }
        ).then(res => {
            if(this.props.handleAsignment)
			    this.props.handleAsignment();
        });
    }

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

    handleAsignment = (event) => {
        this.set_unit_last_asignment()		
	}

    getOptionValue = () =>{
        if(this.state.reservation_services.length > 0){
            let options = this.state.options_units,
                value = options.find((option)=>option.value===this.state.unit);
            return value;
        } else {
            return null;
        }
    }

	render(){
		const { reservation_services,options_units, last_asigment_unit, value, is_private, unit_code } = this.state;
        const select_option_unit = this.getOptionValue();
		return(
			<Modal
				isOpen={reservation_services.length > 0}
				backdrop="static"
				keyboard={false}
                toggle={this.handleClose}>
				<ModalHeader className="text-center" toggle={this.handleClose}>Asignar Unidad</ModalHeader>
				<ModalBody>
                    <Row>
                        {reservation_services.length > 0?<>
                        <Col sm={9}>
                            <FormGroup row>
                                <Label
                                    for="exampleEmail"
                                    sm={2}>
                                    Unidad
                                </Label>
                                <Col sm={10}>
                                    <Select
                                        options={options_units}
                                        isClearable={true}
                                        isSearchable={true}
                                        placeholder="Unidad" 
                                        name="unit"
                                        value={select_option_unit}
                                        onChange={this.onChangeSelectValue}/>
                                </Col>
                            </FormGroup>
                        </Col>
                        <Col sm={3}>
                            <Input type="number"
                                name="number"
                                value={value}
                                onChange={this.onChangeValue}
                                disabled={select_option_unit==null||is_private==false}/>
                        </Col>
                        <Col sm={12}>
                            <Label>{unit_code?unit_code + (last_asigment_unit>0? "-" + last_asigment_unit:""):""}</Label>
                        </Col>
                        <Col sm={12}>
                            <h6>Reservaciones:</h6>
                            <List>
                            {reservation_services.map((reservation_service, index) => (
                                <li>{reservation_service.reference.toString().padStart(6, '0')} {reservation_service.unit!==null?" - "+reservation_service.unit_code+(reservation_service.number>0?"-"+reservation_service.number:""):""} </li>
                            ))} 
                            </List>
                        </Col>
                        </>:<></>}
                    </Row>
				</ModalBody>
                <ModalFooter>
                    <ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" onClick={this.handleAsignment}>
							Aceptar
						</Button>
					</ButtonGroup>
                </ModalFooter>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalOperationUnit {...props} history={history} />;
}