import React,{Component} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, ListGroup, ListGroupItem, Table, InputGroup, List } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl, ApiSalesUrl } from '../../constants/api/site';
class ModalOperationUnit extends Component{
	
    constructor(props){
        super(props);
        this.handleClose = this.handleClose.bind(this);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.handleAsignment = this.handleAsignment.bind(this);
        this.state={
            sales:[],
            unit:"",
            property:null,
        }
    }

    onChangeValue(event) {
		this.setState({
			[event.target.name]:event.target.value,
		});
    }

	isDataChange(prev_data, new_data){
        if(prev_data.sales.length !== new_data.sales.length)
            return true;
        if(prev_data.unit !== new_data.unit)
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
        this.setState({
            sales:data.sales,
            property:data.property
        })
    }

    set_unit_last_asignment(){
        axios.put(`${ApiSalesUrl}operations_unit_set_asigment/`,
            {
                unit: this.state.unit,
                sales:this.state.sales.map((sale)=>sale.id)
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

	render(){
		const { sales, unit, } = this.state;
		return(
			<Modal
				isOpen={sales.length > 0}
				backdrop="static"
				keyboard={false}
                toggle={this.handleClose}>
				<ModalHeader className="text-center" toggle={this.handleClose}>Asignar Unidad</ModalHeader>
				<ModalBody>
                    <Row>
                        {sales.length > 0?<>
                        <Col sm={12}>
                            <FormGroup row>
                                <Label sm={2}>
                                    Unidad
                                </Label>
                                <Col sm={10}>
                                    <Input type='text'
                                        placeholder="Unidad" 
                                        name="unit"
                                        value={unit}
                                        onChange={this.onChangeValue}/>
                                </Col>
                            </FormGroup>
                        </Col>
                        <Col sm={12}>
                            <h6>Ventas:</h6>
                            <List>
                            {sales.map((sale, index) => (
                                <li>{sale.status}{sale.id.toString().padStart(8, '0')} {sale.unit} </li>
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