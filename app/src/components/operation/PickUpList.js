import React,{Component} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Table, ButtonGroup, Button, Row, Col, Input } from "reactstrap";
import { ApiUrl } from '../../constants/api/site';
import axios from "axios";
import moment from 'moment';
class PickUpList extends Component{
    constructor(props){
        super(props);
        this.state={
            data:[],
            params:{
                search: "",
                ordering: null,
            }
        }
    }

    refreshList(){
        axios.get(`${ApiUrl}operations/pick_ups/`,{
                params: this.state.params,
            }).then(res=>{
                this.setState({
                    data:res.data.results
                });
            })
    };

    componentDidMount(){
        this.setState(function (prevState) {
            return {
                params: {
                    ...prevState.params,
                    search: ""
                },
            };
        });
    }

    componentDidUpdate(prevProps, prevState){
        if(prevState.params !== this.state.params){
            this.refreshList();
        }
    }

    onDeleteRow = (row) =>{
        if(window.confirm("¿Desea eliminar '"+row.name+"' de Pick Up?")){
            axios.delete(`${ApiUrl}operations/pick_ups/${row.id}/`)
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

    render(){
        const { data, params} = this.state;
        return(
            <Row>
                <Col lg="2">
                    <Link to={"/pick_up/"}>
						<Button className="btn" color="primary" size="sm" block>
							<h5 className='mb-0'><i className="bi bi-plus"></i></h5>
						</Button>
					</Link>
                </Col>
                <Col></Col>
                <Col lg="4">
					<Input
						bsSize="sm"
						name="search"
						placeholder="Busqueda"
						type="search"
						value={params.search}
						onChange={this.onChangeSearch.bind(this)}/>
				</Col>
                <Col lg="12">
                    <p id="before-table"></p>
                    <div className='table-scroll'>       
                        <div className='table-wrap'>
                            <Table size='sm' responsive bordered>
                                <thead>
                                    <tr>
                                        <th width={"12%"} onClick={(e)=> this.onColumnClick("id")}>ID {this.sortTable("id")}</th>
                                        <th width={"30%"} onClick={(e)=> this.onColumnClick("hotel__name")}>Hotel {this.sortTable("hotel__name")}</th>
                                        <th width={"15%"} onClick={(e)=> this.onColumnClick("hotel__zone_id")}>Zona {this.sortTable("hotel__zone_id")}</th>
                                        <th scope="col">00:31</th>
                                        <th scope="col">01:31</th>
                                        <th scope="col">02:31</th>
                                        <th scope="col">03:31</th>
                                        <th scope="col">04:31</th>
                                        <th scope="col">05:31</th>
                                        <th scope="col">06:31</th>
                                        <th scope="col">07:31</th>
                                        <th scope="col">08:31</th>
                                        <th scope="col">09:31</th>
                                        <th scope="col">10:31</th>
                                        <th scope="col">11:31</th>
                                        <th scope="col">12:31</th>
                                        <th scope="col">13:31</th>
                                        <th scope="col">14:31</th>
                                        <th scope="col">15:31</th>
                                        <th scope="col">16:31</th>
                                        <th scope="col">17:31</th>
                                        <th scope="col">18:31</th>
                                        <th scope="col">19:31</th>
                                        <th scope="col">20:31</th>
                                        <th scope="col">21:31</th>
                                        <th scope="col">22:31</th>
                                        <th scope="col">23:31</th>
                                        <th width={"13%"}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, index) => (
                                        <tr key={row.id}>
                                            <td>{row.id}</td>
                                            <td>{row.hotel_name}</td>
                                            <td>{row.hotel_zone}</td>
                                            {row.pickuptimes.map((pickuptime, index) => (
                                                <td>{pickuptime.time?moment(pickuptime.time, "HH:mm:ss").format('HH:mm'):"00:00"}</td>
                                            ))}
                                            <td className='text-center'>
                                                <ButtonGroup>
                                                    <Link to={`/pick_up/${row.id}`}>
                                                        <Button color="info"
                                                            size='sm'>
                                                            <i className="bi bi-pencil-fill"></i>
                                                        </Button>
                                                    </Link>
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
                        </div>
                    </div>
                    
                </Col>
            </Row>
        )
    }
}
export default function(props) {
    const history = useNavigate();
    return <PickUpList {...props} history={history} />;
}