import React,{Component} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, Table, ButtonGroup, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
import AvailabilityForm from './AvailabilityForm';
class AvailabilityList extends Component{
    constructor(props){
        super(props);
        this.handleAvailabilityEdit = this.handleAvailabilityEdit.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.state={
            data:[],
            params:{
                search: null,
                ordering: null,
                availability_group:null,
            },
            form:false,
            clone:null,
            id:null
        }
    }

    addNewRate = (row) =>{
        this.setState({
            form:true,
            clone:null,
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
        axios.get(`${ApiUrl}sales/availabilities/`,{
            params: this.state.params,
        }).then(res=>{
            this.setState({
                data:res.data.results
            });
        })
    };

    componentDidMount(){
        let availability_group = this.props.availability_group?this.props.availability_group:null;
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    availability_group: availability_group,
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        let availability_group = this.props.availability_group?this.props.availability_group:null;
        if (prevState.params.availability_group !== this.props.availability_group) {
            this.setState(function (prevState) {
                return {
                    params: {
                        ...prevState.params,
                        availability_group: availability_group,
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
            prevParams.availability_group !== currentParams.availability_group
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.start_date+"' de disponilibidad?")){
            axios.delete(`${ApiUrl}sales/availabilities/${row.id}/`)
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

    handleAvailabilityEdit = (event,id) => {
        this.setState({
            form:true,
            clone:null,
            id:id,
        });
	}

    handleCutDates = (row) => {
        if(window.confirm("¿Desea hacer corte de fecha para el periodo " + moment(row.start_date).format('L') + " - " + moment(row.due_date).format('L') + "?")){
            this.setState({
                form:true,
                clone:row,
                id:null,
            });
        }
	}

    handleSave = () => {
        this.setState({
            form:false,
            clone:null,
            id:null,
        });
        this.refreshList();
	}

    render(){
        const {data,id,form,clone} = this.state;
        const {search,availability_group} = this.state.params;
        return(
            <Row className='border-top pt-3'>
                <Col lg={12}>
                    <h4>Horarios de disponilibidad</h4>
                </Col>
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
                                <th width={"5%"} onClick={(e)=> this.onColumnClick("id")}>ID {this.sortTable("id")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("start_date")}>Periodo de inicio {this.sortTable("start_date")}</th>
                                <th width={"15%"} onClick={(e)=> this.onColumnClick("due_date")}>Periodo de fin {this.sortTable("due_date")}</th>
                                <th onClick={(e)=> this.onColumnClick("schedule_1__time")}>Horario 1 {this.sortTable("schedule_1__time")}</th>
                                <th onClick={(e)=> this.onColumnClick("schedule_2__time")}>Horario 2 {this.sortTable("schedule_2__time")}</th>
                                <th onClick={(e)=> this.onColumnClick("schedule_3__time")}>Horario 3 {this.sortTable("schedule_3__time")}</th>
                                <th onClick={(e)=> this.onColumnClick("schedule_4__time")}>Horario 4 {this.sortTable("schedule_4__time")}</th>
                                <th onClick={(e)=> this.onColumnClick("schedule_5__time")}>Horario 5 {this.sortTable("schedule_5__time")}</th>
                                <th onClick={(e)=> this.onColumnClick("schedule_6__time")}>Horario 6 {this.sortTable("schedule_6__time")}</th>
                                <th onClick={(e)=> this.onColumnClick("schedule_7__time")}>Horario 7 {this.sortTable("schedule_7__time")}</th>
                                <th width={"10%"}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{moment(row.start_date).format('LL')}</td>
                                    <td>{moment(row.due_date).format('LL')}</td>
                                    <td>{row.schedule_1_time}</td>
                                    <td>{row.schedule_2_time}</td>
                                    <td>{row.schedule_3_time}</td>
                                    <td>{row.schedule_4_time}</td>
                                    <td>{row.schedule_5_time}</td>
                                    <td>{row.schedule_6_time}</td>
                                    <td>{row.schedule_7_time}</td>
                                    <td className='text-center'>
                                        <ButtonGroup>
                                            <Button color="info" size='sm' onClick={(e)=>{this.handleAvailabilityEdit(e,row.id)}}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </Button>
                                            <Button size='sm' onClick={(e)=> this.handleCutDates(row)}>
                                                <i className="bi bi-calendar-range-fill"></i>
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
                    <AvailabilityForm handleSave={this.handleSave} availability_group={availability_group} id={id} clone={clone} />
                </Col>:<></>}
			</Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <AvailabilityList {...props} history={history} />;
}