import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CardTitle, CardSubtitle, Button, Row, Col, Card, CardImg, CardBody, Table, ButtonGroup, Form, FormGroup, Label, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import ServiceRateComissionForm from './ServiceRateComissionForm';
class ServiceRateComissionList extends Component{
    constructor(props){
        super(props);
        this.handleServiceRateComissionEdit = this.handleServiceRateComissionEdit.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.state={
            data:[],
            params:{
                search: null,
                ordering: null,
                service_rate:null,
            },
            form:false,
            id:null
        }
    }

    addNewRate = (row) =>{
        this.setState({
            form:true,
            id:null,
        });
    }

    onChangeSearch(e) {
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: e.target.value,
                },
            };
        });
	};

    refreshList(){
        axios.get(`${ApiUrl}sales/service_rate_comissions/`,{
            params: this.state.params,
        }).then(res=>{
            this.setState({
                data:res.data.results
            });
        })
    };

    componentDidMount(){
        let service_rate = this.props.service_rate?this.props.service_rate:null;
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    service_rate: service_rate,
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        let service_rate = this.props.service_rate?this.props.service_rate:null;
        if (prevState.params.service_rate !== this.props.service_rate) {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        service_rate: service_rate,
                    },
                };
            });
		}
        if(this.checkParams(prevState.params,this.state.params)){
            this.refreshList();
        }
        
    }

    checkParams(prevParams, currentParams){
        return prevParams.search !== currentParams.search ||
            prevParams.ordering !== currentParams.ordering ||
            prevParams.service_rate !== currentParams.service_rate
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.start_date+"' de tarifa?")){
            axios.delete(`${ApiUrl}sales/service_rate_comissions/${row.id}/`)
                .then(res => {
                    this.refreshList();
                });
        }
    }

    onColumnClick = (field) => {
        if(this.state.params.ordering === field){
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: "-"+field
                    },
                };
            });
        } else {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        ordering: field
                    },
                };
            });
        }
    }

    sortTable = (field) => {
        if(this.state.params.ordering !== null){
            switch(this.state.params.ordering){
                case field:
                    return (<i className="bi bi-sort-alpha-down text-right"></i>)
                case "-"+field:
                    return (<i className="bi bi-sort-alpha-up text-right"></i>)
            }
        }
        return (<></>)
    }

    currencyFormat(num){
        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    handleServiceRateComissionEdit = (event,id) => {
        this.setState({
            form:true,
            id:id,
        });
	}

    handleSave = () => {
        this.setState({
            form:false,
            id:null,
        });
        this.refreshList();
	}

    render(){
        const {data,id,form} = this.state;
        const {search,service_rate} = this.state.params;
        return(
            <Row className='border-top pt-3'>
                <Col lg={12}><h4>Comisión de representante</h4></Col>
				<Col lg="2">
                    <Button className="btn" color="primary" size="sm" block onClick={(e)=> this.addNewRate()}>
						<h5 className='mb-0'><i className="bi bi-plus"></i></h5>
					</Button>
				</Col>
				<Col></Col>
				<Col lg="4">
					<Input
						bsSize="sm"
						name="search"
						placeholder="Busqueda"
						type="search"
						value={search}
						onChange={this.onChangeSearch.bind(this)}/>
				</Col>
				<Col lg="12">
                    <p id="before-table"></p>
                    <Table size='sm' className="no-wrap align-middle" responsive striped bordered id="dataTable">
                        <thead>
                            <tr>
                                <th width={"12%"} onClick={(e)=> this.onColumnClick("id")}>ID {this.sortTable("id")}</th>
                                <th width={"45%"} onClick={(e)=> this.onColumnClick("payment_type__name")}>Tipo de forma de pago{this.sortTable("payment_type__name")}</th>
                                <th width={"30%"} onClick={(e)=> this.onColumnClick("comission")}>Comisión %{this.sortTable("comission")}</th>
                                <th width={"13%"}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{row.payment_type_name}</td>
                                    <td>{row.comission}%</td>
                                    <td className='text-center'>
                                        <ButtonGroup>
                                            <Button color="info" size='sm' onClick={(e)=>{this.handleServiceRateComissionEdit(e,row.id)}}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button color="warning" 
                                                size='sm'
                                                onClick={(e)=> this.onDeleteRow(row)}>
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                        </ButtonGroup>
                                    </td>
                                </tr>
                            ))} 
                        </tbody>
                    </Table>
				</Col>
                {form?
                <Col lg="12" className={"pt-3 border-top"}>
                    <ServiceRateComissionForm handleSave={this.handleSave} service_rate={service_rate} id={id} />
                </Col>:<></>}
			</Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <ServiceRateComissionList {...props} history={history} />;
}