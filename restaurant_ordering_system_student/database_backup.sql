--
-- PostgreSQL database dump
--

\restrict 3kdKUg1VHaklIWUe6IA7ZAqlbJjbkfhiIxLWrrsVYuiPcyOBZBiLo8fjKX5TJV5

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-06-30 14:13:00

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 245 (class 1255 OID 25777)
-- Name: create_feedback(integer, integer, integer, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_feedback(IN p_member_id integer, IN p_product_id integer, IN p_rating integer, IN p_comments character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN 
	-- validate product exists
	IF p_product_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM product
    WHERE product_id = p_product_id
) THEN
    RAISE EXCEPTION 'Product does not exist.';
END IF;
	-- validate rating
	IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
    	RAISE EXCEPTION 'Rating must be between 1 and 5.';
	END IF;

	-- validate comments
	IF p_comments IS NULL OR TRIM(p_comments) = '' THEN
    	RAISE EXCEPTION 'Comments cannot be empty.';
	END IF;
	
	--join two tables and check if the member has bought the product he wants to review--
	IF NOT EXISTS (
        SELECT 1 
        FROM sale_order so
        JOIN sale_order_item soi
            ON so.order_id = soi.order_id
        WHERE so.member_id = p_member_id 
          AND so.status = 'COMPLETED'
          AND soi.product_id = p_product_id
    ) THEN 
        RAISE EXCEPTION 'You can provide feedback only on items you have bought.';
    END IF;

	--check if a member has already provided feedback on the product before--
	--if he has, then he can only update his existing feedback--
	--UNIQUE(member_id, product_id) blocks duplicate feedback but we want to provide our tailored error message--
    IF EXISTS (
        SELECT 1
        FROM dining_feedback
        WHERE member_id = p_member_id
          AND product_id = p_product_id
    ) THEN
        RAISE EXCEPTION 'You have already provided feedback for this item. Please update your existing feedback.';
    END IF;

    INSERT INTO dining_feedback(member_id, product_id, rating, comments)
    VALUES(p_member_id, p_product_id, p_rating, TRIM(p_comments));

END;
$$;


--
-- TOC entry 249 (class 1255 OID 25789)
-- Name: create_response(integer, integer, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_response(IN p_feedback_id integer, IN p_member_id integer, IN p_response_comment character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_feedback_author_id INTEGER;
BEGIN
    -- Check feedback_id is not null
    IF p_feedback_id IS NULL THEN
        RAISE EXCEPTION 'Feedback ID is required.';
    END IF;

    -- Check member_id is not null
    IF p_member_id IS NULL THEN
        RAISE EXCEPTION 'Member ID is required.';
    END IF;

    -- Check response comment is not empty
    IF p_response_comment IS NULL OR TRIM(p_response_comment) = '' THEN
        RAISE EXCEPTION 'Response comment cannot be empty.';
    END IF;

    -- Check feedback exists
    IF NOT EXISTS (
        SELECT 1
        FROM dining_feedback df
        WHERE df.feedback_id = p_feedback_id
    ) THEN
        RAISE EXCEPTION 'Feedback not found.';
    END IF;

    -- Check member exists
    IF NOT EXISTS (
        SELECT 1
        FROM member m
        WHERE m.member_id = p_member_id
    ) THEN
        RAISE EXCEPTION 'Member not found.';
    END IF;

    -- Get feedback author
    SELECT df.member_id
    INTO v_feedback_author_id
    FROM dining_feedback df
    WHERE df.feedback_id = p_feedback_id;

    -- Check member is not responding to own feedback
    IF v_feedback_author_id = p_member_id THEN
        RAISE EXCEPTION 'You cannot respond to your own feedback.';
    END IF;

    -- Insert response
    INSERT INTO feedback_response(feedback_id, member_id, response_comment)
    VALUES(p_feedback_id, p_member_id, TRIM(p_response_comment));
END;
$$;


--
-- TOC entry 233 (class 1255 OID 25783)
-- Name: delete_feedback(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_feedback(IN p_member_id integer, IN p_feedback_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
	--Check feedback exists
	IF NOT EXISTS(
	  SELECT 1
	  FROM dining_feedback
	  WHERE feedback_id = p_feedback_id
	) THEN 
		RAISE EXCEPTION 'Feedback not found.';
	END IF;

	--Check feedback belongs to this member
	IF NOT EXISTS (
		SELECT 1
		FROM dining_feedback
		WHERE feedback_id = p_feedback_id
		AND member_id = p_member_id
	) THEN
		RAISE EXCEPTION 'You can delete your own feedback only.';
	END IF;

	--delete feedback
	DELETE FROM dining_feedback
	WHERE feedback_id = p_feedback_id
	AND member_id = p_member_id;
END;
$$;


--
-- TOC entry 251 (class 1255 OID 25791)
-- Name: delete_response(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_response(IN p_member_id integer, IN p_response_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check member_id is not null
    IF p_member_id IS NULL THEN
        RAISE EXCEPTION 'Member ID is required.';
    END IF;

    -- Check response_id is not null
    IF p_response_id IS NULL THEN
        RAISE EXCEPTION 'Response ID is required.';
    END IF;

    -- Check response exists
    IF NOT EXISTS (
        SELECT 1
        FROM feedback_response fr
        WHERE fr.response_id = p_response_id
    ) THEN
        RAISE EXCEPTION 'Response not found.';
    END IF;

    -- Check response belongs to this member
    IF NOT EXISTS (
        SELECT 1
        FROM feedback_response fr
        WHERE fr.response_id = p_response_id
          AND fr.member_id = p_member_id
    ) THEN
        RAISE EXCEPTION 'You can delete only your own response.';
    END IF;

    -- Delete response
    DELETE FROM feedback_response
    WHERE response_id = p_response_id
      AND member_id = p_member_id;
END;
$$;


--
-- TOC entry 232 (class 1255 OID 25782)
-- Name: get_feedback(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_feedback(p_member_id integer) RETURNS TABLE(feedback_id integer, product_name character varying, rating integer, comments character varying, updated_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN 
	RETURN QUERY 
	SELECT df.feedback_id, p.name, df.rating, df.comments, df.updated_at
	FROM dining_feedback df
	JOIN product p
	ON df.product_id = p.product_id
	WHERE df.member_id = p_member_id;
END;
$$;


--
-- TOC entry 248 (class 1255 OID 25788)
-- Name: get_feedback_by_product(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_feedback_by_product(p_product_id integer, p_logged_in_member_id integer) RETURNS TABLE(feedback_id integer, member_id integer, member_name text, rating integer, comments character varying, last_updated timestamp without time zone, can_respond boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Check product exists
    IF p_product_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM product p
        WHERE p.product_id = p_product_id
    ) THEN
        RAISE EXCEPTION 'Product not found.';
    END IF;
	RETURN QUERY
	SELECT df.feedback_id, m.member_id,  CONCAT(m.first_name, ' ', m.last_name) AS member_name, df.rating, df.comments, df.updated_at AS last_updated, df.member_id <> p_logged_in_member_id AS can_respond
	FROM dining_feedback df
	JOIN member m
	ON df.member_id = m.member_id
	WHERE df.product_id = p_product_id
	ORDER BY updated_at DESC;
END;
$$;


--
-- TOC entry 250 (class 1255 OID 25790)
-- Name: get_responses_by_feedback(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_responses_by_feedback(p_feedback_id integer, p_member_id integer) RETURNS TABLE(response_id integer, feedback_id integer, member_id integer, member_name text, response_comment character varying, created_at timestamp without time zone, can_delete boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check feedback exists
    IF NOT EXISTS (
        SELECT 1
        FROM dining_feedback df
        WHERE df.feedback_id = p_feedback_id
    ) THEN
        RAISE EXCEPTION 'Feedback not found.';
    END IF;

    RETURN QUERY
    SELECT
        fr.response_id,
        fr.feedback_id,
        fr.member_id,
        CONCAT(m.first_name, ' ', m.last_name) AS member_name,
        fr.response_comment,
        fr.created_at,
		fr.member_id = p_member_id AS can_delete
    FROM feedback_response fr
    JOIN member m
        ON fr.member_id = m.member_id
    WHERE fr.feedback_id = p_feedback_id
    ORDER BY fr.created_at ASC;
END;
$$;


--
-- TOC entry 247 (class 1255 OID 25779)
-- Name: get_sale_order_summary(integer, date, date, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sale_order_summary(p_admin_member_id integer, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_category text DEFAULT NULL::text, p_sort_by text DEFAULT 'order_date'::text, p_sort_order text DEFAULT 'DESC'::text) RETURNS TABLE(order_id integer, customer_name text, order_date timestamp without time zone, total_amount numeric, status text, product_count integer, products_ordered text)
    LANGUAGE plpgsql
    AS $_$
DECLARE
    query TEXT;
BEGIN
	-- Set default sort values if NULL is passed
    p_sort_by := COALESCE(p_sort_by, 'order_date');
    p_sort_order := COALESCE(p_sort_order, 'DESC');
	
    -- Check admin access
    IF NOT EXISTS (
        SELECT 1
        FROM member_role mr
        WHERE mr.member_id = p_admin_member_id
        AND mr.role = 'ADMIN'
    ) THEN
        RAISE EXCEPTION 'Access denied. Only admins can access the dashboard.';
    END IF;

    -- Validate start and end date
    IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
        IF p_end_date < p_start_date THEN
            RAISE EXCEPTION 'End date cannot be earlier than start date';
        END IF;
    END IF;

    -- Validate sort_by field
    IF LOWER(p_sort_by) NOT IN (
        'order_date', 
        'total_amount',
        'customer_name', 
        'status'
    ) THEN
        RAISE EXCEPTION 'Invalid sort field: %', p_sort_by;
    END IF;

    -- Validate sort order
    IF LOWER(p_sort_order) NOT IN ('ascending', 'descending', 'asc', 'desc') THEN
        RAISE EXCEPTION 'Invalid sort order: %', p_sort_order;
    END IF;

    -- Convert sort order to SQL standard
    p_sort_order := CASE 
        WHEN LOWER(p_sort_order) = 'ascending' THEN 'ASC' 
        WHEN LOWER(p_sort_order) = 'descending' THEN 'DESC'
        ELSE UPPER(p_sort_order)
    END;

    -- Build main query
    query := '
        SELECT
            so.order_id::INT AS order_id,
            CONCAT(m.first_name, '' '', m.last_name)::TEXT AS customer_name,
            so.order_date::TIMESTAMP AS order_date,
            so.total_amount::NUMERIC AS total_amount,
            so.status::TEXT AS status,
            SUM(soi.quantity)::INT AS product_count,
            STRING_AGG(p.name, '', '')::TEXT AS products_ordered
        FROM sale_order so
        JOIN member m
            ON so.member_id = m.member_id
        JOIN sale_order_item soi
            ON so.order_id = soi.order_id
        JOIN product p
            ON soi.product_id = p.product_id
        WHERE
            ($1 IS NULL OR so.order_date::DATE >= $1)
            AND ($2 IS NULL OR so.order_date::DATE <= $2)
            AND ($3 IS NULL OR $3 = '''' OR p.category = $3)
        GROUP BY
            so.order_id,
            m.first_name,
            m.last_name,
            so.order_date,
            so.total_amount,
            so.status
    ';

    -- Add dynamic ORDER BY
    query := query || ' ORDER BY ' || quote_ident(LOWER(p_sort_by)) || ' ' || UPPER(p_sort_order);

    -- Execute query with filter parameters
    RETURN QUERY EXECUTE query
    USING p_start_date, p_end_date, p_category;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error retrieving sale order summary: %', SQLERRM;
END;
$_$;


--
-- TOC entry 246 (class 1255 OID 25784)
-- Name: update_feedback(integer, integer, integer, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.update_feedback(IN p_member_id integer, IN p_feedback_id integer, IN p_rating integer, IN p_comments character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
 --Check feedback exists
	IF NOT EXISTS(
	  SELECT 1
	  FROM dining_feedback
	  WHERE feedback_id = p_feedback_id
	) THEN 
		RAISE EXCEPTION 'Feedback not found.';
	END IF;

--Check feedback belongs to this member
	IF NOT EXISTS (
		SELECT 1
		FROM dining_feedback
		WHERE feedback_id = p_feedback_id
		AND member_id = p_member_id
	) THEN
		RAISE EXCEPTION 'You can update your own feedback only.';
	END IF;

-- validate rating
	IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
    	RAISE EXCEPTION 'Rating must be between 1 and 5.';
	END IF;

	-- validate comments
	IF p_comments IS NULL OR TRIM(p_comments) = '' THEN
    	RAISE EXCEPTION 'Comments cannot be empty.';
	END IF;

	UPDATE dining_feedback 
	SET rating = p_rating, 
	comments = p_comments,
	updated_at = CURRENT_TIMESTAMP
	WHERE member_id = p_member_id
	AND feedback_id = p_feedback_id;
END;
$$;


--
-- TOC entry 229 (class 1259 OID 25726)
-- Name: dining_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dining_feedback (
    feedback_id integer NOT NULL,
    member_id integer NOT NULL,
    product_id integer NOT NULL,
    rating integer NOT NULL,
    comments character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dining_feedback_comments CHECK ((TRIM(BOTH FROM comments) <> ''::text)),
    CONSTRAINT chk_dining_feedback_rating CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- TOC entry 228 (class 1259 OID 25725)
-- Name: dining_feedback_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.dining_feedback ALTER COLUMN feedback_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.dining_feedback_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 25753)
-- Name: feedback_response; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_response (
    response_id integer NOT NULL,
    feedback_id integer NOT NULL,
    member_id integer NOT NULL,
    response_comment character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_response_comment CHECK ((TRIM(BOTH FROM response_comment) <> ''::text))
);


--
-- TOC entry 230 (class 1259 OID 25752)
-- Name: feedback_response_response_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.feedback_response ALTER COLUMN response_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.feedback_response_response_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 219 (class 1259 OID 25575)
-- Name: member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member (
    member_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 220 (class 1259 OID 25587)
-- Name: member_member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 220
-- Name: member_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_member_id_seq OWNED BY public.member.member_id;


--
-- TOC entry 221 (class 1259 OID 25588)
-- Name: member_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_role (
    member_id integer NOT NULL,
    role character varying(20) NOT NULL,
    CONSTRAINT member_role_role_check CHECK (((role)::text = ANY (ARRAY[('ADMIN'::character varying)::text, ('USER'::character varying)::text])))
);


--
-- TOC entry 222 (class 1259 OID 25594)
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    product_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category character varying(50),
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 223 (class 1259 OID 25604)
-- Name: product_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 223
-- Name: product_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_product_id_seq OWNED BY public.product.product_id;


--
-- TOC entry 224 (class 1259 OID 25605)
-- Name: sale_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order (
    order_id integer NOT NULL,
    member_id integer,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) NOT NULL,
    delivery_address text,
    CONSTRAINT sale_order_status_check CHECK (((status)::text = ANY (ARRAY[('COMPLETED'::character varying)::text, ('CANCELLED'::character varying)::text, ('PACKING'::character varying)::text])))
);


--
-- TOC entry 225 (class 1259 OID 25615)
-- Name: sale_order_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order_item (
    order_item_id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    CONSTRAINT sale_order_item_quantity_check CHECK ((quantity > 0))
);


--
-- TOC entry 226 (class 1259 OID 25623)
-- Name: sale_order_item_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_item_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5093 (class 0 OID 0)
-- Dependencies: 226
-- Name: sale_order_item_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_item_order_item_id_seq OWNED BY public.sale_order_item.order_item_id;


--
-- TOC entry 227 (class 1259 OID 25624)
-- Name: sale_order_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5094 (class 0 OID 0)
-- Dependencies: 227
-- Name: sale_order_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_order_id_seq OWNED BY public.sale_order.order_id;


--
-- TOC entry 4894 (class 2604 OID 25625)
-- Name: member member_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member ALTER COLUMN member_id SET DEFAULT nextval('public.member_member_id_seq'::regclass);


--
-- TOC entry 4896 (class 2604 OID 25626)
-- Name: product product_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product ALTER COLUMN product_id SET DEFAULT nextval('public.product_product_id_seq'::regclass);


--
-- TOC entry 4899 (class 2604 OID 25627)
-- Name: sale_order order_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order ALTER COLUMN order_id SET DEFAULT nextval('public.sale_order_order_id_seq'::regclass);


--
-- TOC entry 4901 (class 2604 OID 25628)
-- Name: sale_order_item order_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item ALTER COLUMN order_item_id SET DEFAULT nextval('public.sale_order_item_order_item_id_seq'::regclass);


--
-- TOC entry 4912 (class 2606 OID 25630)
-- Name: member member_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_email_key UNIQUE (email);


--
-- TOC entry 4914 (class 2606 OID 25632)
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (member_id);


--
-- TOC entry 4918 (class 2606 OID 25634)
-- Name: member_role member_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_pkey PRIMARY KEY (member_id, role);


--
-- TOC entry 4916 (class 2606 OID 25636)
-- Name: member member_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_username_key UNIQUE (username);


--
-- TOC entry 4926 (class 2606 OID 25741)
-- Name: dining_feedback pk_dining_feedback; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT pk_dining_feedback PRIMARY KEY (feedback_id);


--
-- TOC entry 4930 (class 2606 OID 25766)
-- Name: feedback_response pk_response; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response
    ADD CONSTRAINT pk_response PRIMARY KEY (response_id);


--
-- TOC entry 4920 (class 2606 OID 25638)
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);


--
-- TOC entry 4924 (class 2606 OID 25640)
-- Name: sale_order_item sale_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_pkey PRIMARY KEY (order_item_id);


--
-- TOC entry 4922 (class 2606 OID 25642)
-- Name: sale_order sale_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_pkey PRIMARY KEY (order_id);


--
-- TOC entry 4928 (class 2606 OID 25794)
-- Name: dining_feedback uq_dining_feedback_member_product; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT uq_dining_feedback_member_product UNIQUE (member_id, product_id);


--
-- TOC entry 4935 (class 2606 OID 25742)
-- Name: dining_feedback fk_dining_feedback_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT fk_dining_feedback_member FOREIGN KEY (member_id) REFERENCES public.member(member_id);


--
-- TOC entry 4936 (class 2606 OID 25747)
-- Name: dining_feedback fk_dining_feedback_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT fk_dining_feedback_product FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- TOC entry 4937 (class 2606 OID 25767)
-- Name: feedback_response fk_response_feedback; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response
    ADD CONSTRAINT fk_response_feedback FOREIGN KEY (feedback_id) REFERENCES public.dining_feedback(feedback_id) ON DELETE CASCADE;


--
-- TOC entry 4938 (class 2606 OID 25772)
-- Name: feedback_response fk_response_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response
    ADD CONSTRAINT fk_response_member FOREIGN KEY (member_id) REFERENCES public.member(member_id);


--
-- TOC entry 4931 (class 2606 OID 25643)
-- Name: member_role member_role_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(member_id);


--
-- TOC entry 4933 (class 2606 OID 25648)
-- Name: sale_order_item sale_order_item_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.sale_order(order_id);


--
-- TOC entry 4934 (class 2606 OID 25653)
-- Name: sale_order_item sale_order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- TOC entry 4932 (class 2606 OID 25658)
-- Name: sale_order sale_order_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(member_id);


-- Completed on 2026-06-30 14:13:00

--
-- PostgreSQL database dump complete
--

\unrestrict 3kdKUg1VHaklIWUe6IA7ZAqlbJjbkfhiIxLWrrsVYuiPcyOBZBiLo8fjKX5TJV5

