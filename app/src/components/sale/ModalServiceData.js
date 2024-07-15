import React,{Component} from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { FormGroup, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, Form, Row, Col, Input, Badge, Carousel, CarouselIndicators, CarouselItem, CarouselControl, Nav, NavItem, TabContent, TabPane, CarouselCaption } from "reactstrap";
import Select from 'react-select';
import axios from "axios";
import moment from 'moment';
import { ApiUrl, ApiSalesUrl } from '../../constants/api/site';
import TabComponent from '../TabComponent';
class ModalServiceData extends Component{
	
    constructor(props){
        super(props);
        this.goToIndex = this.goToIndex.bind(this);
        this.next = this.next.bind(this);
        this.previous = this.previous.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.state={
            open:false,
            id:null,
            sale_date:"",
            service:null,
            service_rate_data:null,
            activeIndex:0,
            animating:false,
        }
    }

    next = () => {
        if (this.state.animating) return;
        const nextIndex = this.state.activeIndex === this.state.service.images.length - 1 ? 0 : this.state.activeIndex + 1;
        this.setState({
            activeIndex:nextIndex,
        });
    }
    
    previous = () => {
        if (this.state.animating) return;
        const nextIndex = this.state.activeIndex === 0 ? this.state.service.images.length - 1 : this.state.activeIndex - 1;
        this.setState({
            activeIndex:nextIndex,
        });
    }
    
    goToIndex = (newIndex) => {
        if (this.state.animating) return;
        this.setState({
            activeIndex:newIndex,
        });
    }

	componentDidMount() {
        let data = this.props.data?this.props.data:this.state;
		this.reset(data);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevProps.data.id !== this.props.data.id){
			this.reset(this.props.data);
		}
	}

	reset(data){
        let id = data.id!==undefined?data.id:this.state.id;
        let open = data.open!==undefined?data.open:this.state.open;
        let sale_date = data.sale_date!==undefined?data.sale_date:this.state.sale_date;
        if(id!==null){
            axios.get(`${ApiUrl}general/service_data/${id}/`)
            .then(res => {
                this.setState(function (prev_State) {
                    return {
                        ...prev_State,
                        service:res.data,
                    }
                });
            }); 
            axios.get(`${ApiSalesUrl}sale_service_rate/?service_date=${sale_date}&service=${id}`)
            .then(res => {
                this.setState(function (prev_State) {
                    return {
                        ...prev_State,
                        service_rate_data:res.data.data,
                    }
                });
            }); 

        }
        this.setState({
            id: id,
            open: open,
            sale_date: sale_date,
            service:null,
            activeIndex:0,
            animating:false,
        });
	}

    handleClose = (event) => {
		if(this.props.handleClose)
			this.props.handleClose(event);
	}

    Images(items){
        return items.map((item) => {
            return (
              <CarouselItem
                className='text-center'
                onExiting={() => this.setState({animating:true})}
                onExited={() => this.setState({animating:false})}
                key={item.src}
              >
                <img width={"50%"} src={item.src} alt={item.title} />
                <CarouselCaption
                    captionHeader={item.title} 
                />
              </CarouselItem>
            );
        });
    }

    currencyFormat(num){
        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    ServiceRateAdult(){
        return this.currencyFormat(this.state.service_rate_data.adult_price) + " " +  this.state.service_rate_data.currency;
    }

    ServiceRateChild(){
        return this.currencyFormat(this.state.service_rate_data.child_price) + " " +  this.state.service_rate_data.currency;
    }

    tabsComponent(){
        return [
            {
                key:0,
                title: "English",
                component: 
                <Row>
                    <Col sm={12}>
                        {this.state.service.description_en}
                    </Col>
                    {this.state.service_rate_data!==null?
                    <Col sm={12}>
                        <h5>Adult Rate: {this.ServiceRateAdult()}</h5>
                        <h5>Child Rate: {this.ServiceRateChild()}</h5>
                    </Col>
                    :<></>}
                </Row>,
            },
            {
                key:1,
                title: "Español",
                component: 
                <Row>
                    <Col sm={12}>
                        {this.state.service.description_es}
                    </Col>
                    {this.state.service_rate_data!==null?
                    <Col sm={12}>
                        <h5>Tarifa adulto: {this.ServiceRateAdult()}</h5>
                        <h5>Tarifa menor: {this.ServiceRateChild()}</h5>
                    </Col>
                    :<></>}
                </Row>,
            },
            {
                key:3,
                title: "Português",
                component: 
                <Row>
                    <Col sm={12}>
                        {this.state.service.description_po}
                    </Col>
                    {this.state.service_rate_data!==null?
                    <Col sm={12}>
                        <h5>Taxa adulto: {this.ServiceRateAdult()}</h5>
                        <h5>Taxa menor: {this.ServiceRateChild()}</h5>
                    </Col>
                    :<></>}
                </Row>,
            }
        ]
    }

	render(){
		const { open,service,service_rate_data,activeIndex,animating } = this.state;
		return(
			<Modal
				isOpen={open}
				backdrop="static"
                size='lg'
				keyboard={false}>
				<ModalHeader><div className="text-center">{service!==null?service.name:""}</div></ModalHeader>
				<ModalBody>
                    {service!==null?<>
                    <Carousel
                        style={{"minHeight":"200px"}}
                        activeIndex={activeIndex}
                        next={this.next}
                        previous={this.previous}
                        dark>
                        <CarouselIndicators
                            items={service.images}
                            activeIndex={activeIndex}
                            onClickHandler={this.goToIndex}
                        />
                        {this.Images(service.images)}
                        <CarouselControl
                            direction='prev'
                            directionText='Anterior'
                            onClickHandler={this.previous}
                        />
                        <CarouselControl
                            direction='next'
                            directionText='Siguiente'
                            onClickHandler={this.next}
                        />
                    </Carousel>
                    <TabComponent currentTab={"0"} tabs={this.tabsComponent()} className="pt-3" />
                    </>
                    :<></>}
				</ModalBody>
				<ModalFooter>
                    <Button onClick={this.handleClose}>
						Aceptar
					</Button>
				</ModalFooter>
			</Modal>
		)
	}
}
export default function(props) {
    const history = useNavigate();
    return <ModalServiceData {...props} history={history} />;
}