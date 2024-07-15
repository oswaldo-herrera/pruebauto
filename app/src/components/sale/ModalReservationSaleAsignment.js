import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, InputGroup } from "reactstrap";
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiOperationsUrl, ApiSalesUrl } from '../../constants/api/site';
class ModalReservationSaleAsignment extends Component{
	
    constructor(props){
        super(props);
        this.onChangeValue = this.onChangeValue.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.state={
            open:false,
            reservation_id:"",
            property:null,
            reservation_sales:[],
        }
    }

    onChangeValue(event) {
		this.setState({
			[event.target.name]:event.target.value,
		});
    }

    isDataChange(prev_data, new_data){
        if(prev_data.open !== new_data.open)
			return true;
		if(prev_data.property !== new_data.property)
			return true;
        if(prev_data.reservation_id !== new_data.reservation_id)
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
        let reservation_id = data.reservation_id!==undefined?data.reservation_id:this.state.reservation_id;
        this.setState({
            open: open,
            property: property,
            reservation_id: reservation_id
        });
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

    handleSearchReservation(){
        axios.get(`${ApiSalesUrl}sale_reservation_search/`,
            { 
                params: {
                    reservation_number:this.state.reservation_id,
                    property:this.state.property
                }
            }
        ).then(res => {
            this.setState({
                reservation_sales: res.data.map((reservation_sale)=>Object({check:false,sale:reservation_sale})),
            });
        }).catch(error => {
            alert(error.response.data.error)
        });
    }

	onSubmit(e){
        e.preventDefault();
		if(this.props.handleSave)
			this.props.handleSave(this.state.reservation_sales.filter((reservation_sale)=>reservation_sale.check).map((reservation_sale)=>reservation_sale.sale));
	}

	render(){
		const { open, reservation_id, reservation_sales } = this.state;
		return(
			<Modal
				isOpen={open}
				backdrop="static"
				keyboard={false}>
				<ModalHeader><div className="text-center">Reservaciones a ventas</div></ModalHeader>
				<ModalBody>
					<Form onSubmit={this.onSubmit} id="asignment-form">
                        <Row>
                            <Col sm={12}>
                                <FormGroup>
                                    <Label size='sm'>Referencia#</Label>
                                    <InputGroup>
                                        <Input type="number"
                                            bsSize="sm"
                                            name="reservation_id"
                                            value={reservation_id}
                                            onChange={this.onChangeValue}/>
                                        <Button color='success'
                                            size='sm'
                                            onClick={(e)=> this.handleSearchReservation()}>
                                            <i className="bi bi-search"></i>
                                        </Button>
                                    </InputGroup>
                                </FormGroup>
                            </Col>
                            {reservation_sales.map((reservation_sale, index)=>(
                                <Col sm={12}>
                                    <FormGroup check inline>
                                        <Input type="checkbox"
                                            onChange={(event)=>{
                                                let reservation_sales = this.state.reservation_sales;
                                                reservation_sales[index].check = event.target.checked;
                                                this.setState({
                                                    reservation_sales:reservation_sales
                                                });
                                            }}
                                            checked={reservation_sale.check}/>
                                            {' '}
                                        <Label check>
                                        {moment(reservation_sale.sale.service_date).format('DD/MM/YYYY')} - {reservation_sale.sale.service_data.name}
                                        </Label>
                                    </FormGroup>
                                </Col>
                            ))}
                        </Row>
                    </Form>
				</ModalBody>
				<ModalFooter>
					<ButtonGroup className="my-2" size="sm">
						<Button color="primary" onClick={this.handleClose}>
							Cancelar
						</Button>
						<Button color="success" type="submit" form='asignment-form' disabled={reservation_sales.filter((reservation_sale)=>reservation_sale.check).length==0}>
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
    return <ModalReservationSaleAsignment {...props} history={history} />;
}